import { prisma } from '../db.js';
import { BadRequest, NotFound } from '../errors.js';
import {
  ensureEventOwnerOrAdmin,
  ensureProviderOrAdmin,
} from '../services/eventsAccess.js';
import { sendNotification } from '../services/notificationsClient.js';

// adapter mic pentru a păstra semantica Fastify reply pe Express
function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({ send: (body) => res.status(status).json(body) });
  return f;
}

const OFFER_ALLOWED_STATUS = [
  'DRAFT',
  'SENT',
  'REVISED',
  'ACCEPTED',
  'ACCEPTED_BY_CLIENT',
  'DECLINED',
  'REJECTED',
  'REJECTED_BY_CLIENT',
  'WITHDRAWN',
  'CANCELLED',
];

function normalizeOfferForResponse(offer) {
  if (!offer) return offer;
  return {
    ...offer,
    // alias util pentru API / UI
    priceTotal: offer.totalCost,
  };
}

export async function offersRoutes(app) {
  // Provider/Admin: lista ofertelor (toate evenimentele, cu filtrare optională)
  app.get('/offers', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(req.query.pageSize || 20))
    );

    const { invitationId } = req.query;

    const providerId =
      user.userId?.toString() ||
      user.id?.toString() ||
      '';

    const baseWhere =
      user.role === 'provider'
        ? { providerId }
        : {};

    const where = invitationId
      ? { ...baseWhere, invitationId: String(invitationId) }
      : baseWhere;

    const [rows, total] = await Promise.all([
      prisma.eventOffer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.eventOffer.count({ where }),
    ]);

    return reply.send({
      rows: rows.map(normalizeOfferForResponse),
      total,
      page,
      pageSize,
    });
  });

  // Provider: creează o ofertă generică legată de un eveniment (fără invitație)
  app.post('/events/:eventId/offers', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const { eventId } = req.params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw NotFound('Event not found');

    const body = req.body || {};
    const totalCost =
      body.totalCost != null ? Number(body.totalCost) : null;
    const providerId =
      user.userId?.toString() ||
      user.id?.toString() ||
      '';
    const created = await prisma.eventOffer.create({
      data: {
        eventId,
        providerId,
        providerGroupId: body.providerGroupId || null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        totalCost,
        currency: body.currency || 'RON',
        status:
          body.status && OFFER_ALLOWED_STATUS.includes(body.status)
            ? body.status
            : 'DRAFT',
        detailsJson: body.detailsJson ?? null,
        notes: body.notes || body.description || null,
      },
    });

    return reply.code(201).send(normalizeOfferForResponse(created));
  });

  // Provider: creează o ofertă ca răspuns la o invitație
  app.post('/events/:eventId/invitations/:invitationId/offers',
    async (req, res) => {
      const reply = makeReply(res);
      const user = await app.verifyAuth(req);
      const ok = await ensureProviderOrAdmin(user, reply);
      if (!ok) return;

      const { eventId, invitationId } = req.params;

      const invitation = await prisma.eventInvitation.findUnique({
        where: { id: invitationId },
      });
      if (!invitation || invitation.eventId !== eventId) {
        throw NotFound('Invitation not found for this event');
      }

      // validare status invitație
      if (
        ['DECLINED', 'CANCELLED', 'EXPIRED'].includes(invitation.status)
      ) {
        throw BadRequest(
          `Cannot create offer for invitation with status ${invitation.status}`
        );
      }

      // validare deadline
      if (
        invitation.replyDeadline &&
        new Date(invitation.replyDeadline).getTime() < Date.now()
      ) {
        throw BadRequest('Invitation reply deadline is over');
      }

      // provider poate răspunde doar la invitațiile lui
      if (
        user.role === 'provider' &&
        invitation.providerId &&
        invitation.providerId !== user.id?.toString()
      ) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      const body = req.body || {};
      const totalCost =
        body.totalCost != null ? Number(body.totalCost) : null;
      const providerId =
        user.userId?.toString() ||
        user.id?.toString() ||
        '';
      const created = await prisma.eventOffer.create({
        data: {
          eventId,
          invitationId,
          providerId,
          providerGroupId: body.providerGroupId || null,
          startsAt: body.startsAt ? new Date(body.startsAt) : null,
          endsAt: body.endsAt ? new Date(body.endsAt) : null,
          totalCost,
          currency: body.currency || 'RON',
          status:
            body.status && OFFER_ALLOWED_STATUS.includes(body.status)
              ? body.status
              : 'DRAFT',
          detailsJson: body.detailsJson ?? null,
          notes: body.notes || body.description || null,
        },
      });

      return reply.code(201).send(normalizeOfferForResponse(created));
    }
  );

  // Listă de oferte pentru un eveniment
  app.get('/events/:eventId/offers', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId } = req.params;

    let where = { eventId };

    if (user.role === 'provider') {
      where = {
        ...where,
        providerId: user.userId?.toString() || '',
      };
    } else if (user.role !== 'admin') {
      // client: trebuie să fie owner sau participant
      const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
      if (!ev) return;
    }

    const rows = await prisma.eventOffer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(rows.map(normalizeOfferForResponse));
  });

  // Update generic al unei oferte (Provider/Admin) – folosit în ecranul "Ofertele mele" și în ecranul de invitație
  app.put('/offers/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const { id } = req.params;
    const body = req.body || {};

    const existing = await prisma.eventOffer.findUnique({ where: { id } });
    if (!existing) throw NotFound('Offer not found');

    if (
      user.role === 'provider' &&
      existing.providerId !== user.userId?.toString()
    ) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const data = {};

    if (body.totalCost != null) data.totalCost = Number(body.totalCost);
    if (body.currency != null) data.currency = body.currency;
    if (body.startsAt !== undefined) {
      data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    }
    if (body.endsAt !== undefined) {
      data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    }
    if (body.notes !== undefined || body.description !== undefined) {
      data.notes = body.notes || body.description || null;
    }
    if (body.detailsJson !== undefined) {
      data.detailsJson = body.detailsJson;
    }
    if (body.status) {
      if (!OFFER_ALLOWED_STATUS.includes(body.status)) {
        throw BadRequest('Invalid status for offer');
      }
      data.status = body.status;
    }

    if (Object.keys(data).length === 0) {
      return reply.send(normalizeOfferForResponse(existing));
    }

    const prevStatus = existing.status;

    const updated = await prisma.eventOffer.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });

    // notificăm clientul doar când statusul se schimbă în SENT / REVISED
    if (
      body.status &&
      body.status !== prevStatus &&
      (body.status === 'SENT' || body.status === 'REVISED')
    ) {
      const event = await prisma.event.findUnique({
        where: { id: updated.eventId },
        select: { id: true, name: true, clientId: true },
      });

      if (event && event.clientId) {
        await sendNotification({
          userId: event.clientId,
          type:
            body.status === 'SENT'
              ? 'EVENT_OFFER_SUBMITTED'
              : 'EVENT_OFFER_REVISED',
          title:
            body.status === 'SENT'
              ? 'Ofertă nouă primită'
              : 'Ofertă actualizată',
          body:
            body.status === 'SENT'
              ? `Ai o ofertă nouă pentru evenimentul "${event.name}".`
              : `Ai o ofertă actualizată pentru evenimentul "${event.name}".`,
          meta: {
            eventId: updated.eventId,
            offerId: updated.id,
            providerId: updated.providerId,
          },
        });
      }
    }

    return reply.send(normalizeOfferForResponse(updated));
  });

  // Schimbare de status pentru o ofertă din pagina de eveniment (PATCH)
  app.patch('/events/:eventId/offers/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId, id } = req.params;
    const { status } = req.body || {};

    if (!status || !OFFER_ALLOWED_STATUS.includes(status)) {
      throw BadRequest('Invalid status');
    }

    const offer = await prisma.eventOffer.findUnique({ where: { id } });
    if (!offer || offer.eventId !== eventId) {
      throw NotFound('Offer not found for this event');
    }

    // provider poate modifica doar propriile oferte
    if (
      user.role === 'provider' &&
      offer.providerId !== user.userId?.toString()
    ) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    // client poate modifica doar oferte pentru evenimentele lui
    if (user.role === 'client') {
      const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
      if (!ev) return;
    }

    const prevStatus = offer.status;

    const updated = await prisma.eventOffer.update({
      where: { id },
      data: {
        status,
        version: { increment: 1 },
      },
    });

    if (
      status !== prevStatus &&
      (status === 'SENT' || status === 'REVISED')
    ) {
      const event = await prisma.event.findUnique({
        where: { id: updated.eventId },
        select: { id: true, name: true, clientId: true },
      });

      if (event && event.clientId) {
        await sendNotification({
          userId: event.clientId,
          type:
            status === 'SENT'
              ? 'EVENT_OFFER_SUBMITTED'
              : 'EVENT_OFFER_REVISED',
          title:
            status === 'SENT'
              ? 'Ofertă nouă primită'
              : 'Ofertă actualizată',
          body:
            status === 'SENT'
              ? `Ai o ofertă nouă pentru evenimentul "${event.name}".`
              : `Ai o ofertă actualizată pentru evenimentul "${event.name}".`,
          meta: {
            eventId: updated.eventId,
            offerId: updated.id,
            providerId: updated.providerId,
          },
        });
      }
    }

    return reply.send(normalizeOfferForResponse(updated));
  });

  // Client: decizie explicită pe ofertă (ACCEPTED / DECLINED) din ecranul de invitații
  app.post('/offers/:id/decision', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;
    const { decision } = req.body || {};

    const offer = await prisma.eventOffer.findUnique({ where: { id } });
    if (!offer) throw NotFound('Offer not found');

    if (user.role !== 'admin') {
      const ev = await ensureEventOwnerOrAdmin(user, offer.eventId, reply);
      if (!ev) return;
    }

    const allowed = [
      'ACCEPTED',
      'ACCEPTED_BY_CLIENT',
      'DECLINED',
      'REJECTED',
      'REJECTED_BY_CLIENT',
    ];
    if (!allowed.includes(String(decision || ''))) {
      return reply.code(400).send({
        error:
          'decision must be ACCEPTED/DECLINED (or *_BY_CLIENT / REJECTED[_BY_CLIENT])',
      });
    }

    const updated = await prisma.eventOffer.update({
      where: { id },
      data: {
        status: decision,
        version: { increment: 1 },
      },
    });

    const event = await prisma.event.findUnique({
      where: { id: updated.eventId },
      select: { id: true, name: true, clientId: true },
    });

    const isAccepted =
      decision === 'ACCEPTED' || decision === 'ACCEPTED_BY_CLIENT';

    await sendNotification({
      userId: updated.providerId,
      type: 'EVENT_OFFER_DECIDED',
      title: isAccepted
        ? 'Oferta ta a fost acceptată'
        : 'Oferta ta a fost respinsă',
      body: isAccepted
        ? `Oferta ta pentru evenimentul "${event?.name || ''}" a fost acceptată.`
        : `Oferta ta pentru evenimentul "${event?.name || ''}" a fost respinsă.`,
      meta: {
        eventId: updated.eventId,
        offerId: updated.id,
        decision,
      },
    });

    return reply.send(normalizeOfferForResponse(updated));
  });
}
