import { prisma } from '../db.js';
import { ensureEventOwnerOrAdmin, ensureProviderOrAdmin } from '../services/eventsAccess.js';

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({ send: (body) => res.status(status).json(body) });
  return f;
}

export async function invitationsRoutes(app) {
  // List invitații pentru un eveniment (owner/admin)
  app.get('/events/:eventId/invitations', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ev = await ensureEventOwnerOrAdmin(user, req.params.eventId, reply);
    if (!ev) return;

    const rows = await prisma.eventInvitation.findMany({
      where: { eventId: ev.id },
      orderBy: { createdAt: 'desc' }
    });
    return reply.send(rows);
  });

  // Detaliu invitație pentru un eveniment (owner/admin) + ofertele aferente
  // -> pentru viitoarea "pagină de request" la click pe cardul de invitație
  app.get('/events/:eventId/invitations/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId, id } = req.params;

    // verificăm că userul e owner/admin pe eveniment
    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev) return;

    const inv = await prisma.eventInvitation.findUnique({
      where: { id },
    });

    if (!inv || inv.eventId !== ev.id) {
      return reply.code(404).send({ error: 'Invitation not found for this event' });
    }

    // luăm toate ofertele care răspund la această invitație
    const offers = await prisma.eventOffer.findMany({
      where: {
        eventId: ev.id,
        invitationId: inv.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    // trimitem invitația + sumar eveniment + ofertele aferente
    return reply.send({
      invitation: inv,
      event: {
        id: ev.id,
        name: ev.name,
        type: ev.type,
        date: ev.date,
        city: ev.city,
        location: ev.location,
        currency: ev.currency,
        budgetPlanned: ev.budgetPlanned,
        guestCount: ev.guestCount,
      },
      offers,
    });
  });

  // Creează invitație single (owner/admin) - flux punctual (din pagina providerului etc.)
  app.post('/events/:eventId/invitations', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ev = await ensureEventOwnerOrAdmin(user, req.params.eventId, reply);
    if (!ev) return;

    const {
      providerId,
      providerGroupId,
      note,
      message,
      roleHint,
      replyDeadline,
      proposedBudget,
      budgetCurrency,
    } = req.body || {};

    if (!providerId && !providerGroupId) {
      return reply.code(400).send({
        error: 'Either providerId or providerGroupId is required',
      });
    }

    const inv = await prisma.eventInvitation.create({
      data: {
        eventId: ev.id,
        // în modelul Event pe care mi l-ai dat avem clientId, nu ownerId
        clientId: ev.clientId,
        providerId: providerId || null,
        providerGroupId: providerGroupId || null,
        note: note || message || null,
        roleHint: roleHint || null,
        replyDeadline: replyDeadline || null,
        proposedBudget:
          proposedBudget != null && proposedBudget !== ''
            ? Number(proposedBudget)
            : null,
        budgetCurrency: budgetCurrency || ev.currency || null,
      },
    });

    return reply.send(inv);
  });

  // Creează invitații în bulk către mai mulți provideri (backend-ready pentru broadcast)
  app.post('/events/:eventId/invitations/bulk', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ev = await ensureEventOwnerOrAdmin(user, req.params.eventId, reply);
    if (!ev) return;

    const { providerIds, note, proposedBudget, budgetCurrency } = req.body || {};

    if (!Array.isArray(providerIds) || providerIds.length === 0) {
      return reply
        .code(400)
        .send({ error: 'providerIds must be a non-empty array' });
    }

    // normalizăm + deduplicăm
    const ids = Array.from(
      new Set(
        providerIds
          .map((id) => (id == null ? null : String(id).trim()))
          .filter((id) => !!id)
      )
    );

    if (!ids.length) {
      return reply.code(400).send({ error: 'No valid providerIds' });
    }

    try {
      // vedem care au deja invitație la acest eveniment
      const existing = await prisma.eventInvitation.findMany({
        where: {
          eventId: ev.id,
          providerId: { in: ids },
        },
        select: { providerId: true },
      });

      const existingSet = new Set(existing.map((e) => e.providerId));

      const toCreate = ids.filter((id) => !existingSet.has(id));

      if (!toCreate.length) {
        return reply.send({
          createdCount: 0,
          skippedCount: ids.length,
          totalRequested: ids.length,
        });
      }

      const data = toCreate.map((pid) => ({
        eventId: ev.id,
        clientId: ev.clientId,
        providerId: pid,
        note: note || null,
        proposedBudget:
          proposedBudget != null && proposedBudget !== ''
            ? Number(proposedBudget)
            : null,
        budgetCurrency: budgetCurrency || ev.currency || null,
      }));

      const result = await prisma.eventInvitation.createMany({
        data,
        skipDuplicates: true,
      });

      return reply.send({
        createdCount: result.count ?? toCreate.length,
        skippedCount: ids.length - toCreate.length,
        totalRequested: ids.length,
      });
    } catch (err) {
      console.error('Error creating bulk invitations:', err);
      return reply
        .code(500)
        .send({ error: 'Database error creating invitations' });
    }
  });

  // Provider: list invitațiile mele (toate evenimentele) + sumar de eveniment
  app.get('/providers/me/invitations', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const page = Number(req.query.page || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize || 20));

    // în alte rute folosim user.userId -> facem un mic fallback
    const providerUserId = String(user.userId || user.id);

    const [rows, total] = await Promise.all([
      prisma.eventInvitation.findMany({
        where: { providerId: providerUserId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.eventInvitation.count({ where: { providerId: providerUserId } })
    ]);

    // atașăm sumarul evenimentului pentru UI provider
    const eventIds = [...new Set(rows.map((r) => r.eventId).filter(Boolean))];
    let eventsById = {};
    if (eventIds.length) {
      const events = await prisma.event.findMany({
        where: { id: { in: eventIds } },
        select: {
          id: true,
          name: true,
          type: true,
          date: true,
          city: true,
          location: true,
          guestCount: true,
          currency: true
        }
      });
      eventsById = Object.fromEntries(events.map((e) => [e.id, e]));
    }

    const rowsWithEvent = rows.map((r) => ({
      ...r,
      event: eventsById[r.eventId] || null
    }));

    return reply.send({ rows: rowsWithEvent, total, page, pageSize });
  });

  // Provider: detaliu invitație proprie (include eveniment)
  app.get('/providers/me/invitations/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const inv = await prisma.eventInvitation.findUnique({
      where: { id },
      include: {
        event: true,
      },
    });

    if (!inv) {
      return reply.code(404).send({ error: 'Invitation not found' });
    }

    const roles = user.roles || [];
    const isAdmin = roles.includes('ADMIN') || user.isAdmin;
    const providerUserId = String(user.userId || user.id);

    const isClient =
      String(inv.clientId) === String(user.id) ||
      String(inv.clientId) === String(user.clientId);

    const isProvider = String(inv.providerId) === providerUserId;

    // TODO: când vei avea invitații către grupuri, poți extinde aici logica pentru group members

    if (!isAdmin && !isClient && !isProvider) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    return reply.send(inv);
  });

  // Provider: accept/decline invitație
  app.post('/invitations/:id/decision', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const { id } = req.params;
    const { decision } = req.body || {};

    const inv = await prisma.eventInvitation.findUnique({ where: { id } });
    if (!inv) {
      return reply.code(404).send({ error: 'Invitation not found' });
    }

    const providerUserId = String(user.userId || user.id);

    if (user.role !== 'admin' && String(inv.providerId) !== providerUserId) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    if (!['ACCEPTED', 'DECLINED'].includes(String(decision || ''))) {
      return reply.code(400).send({
        error: 'decision must be ACCEPTED or DECLINED'
      });
    }

    const upd = await prisma.eventInvitation.update({
      where: { id },
      data: { status: decision, decidedAt: new Date() }
    });

    return reply.send(upd);
  });
}
