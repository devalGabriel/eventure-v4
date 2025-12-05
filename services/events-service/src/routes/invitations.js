// services/events-service/src/routes/invitations.js
import { prisma } from "../db.js";
import {
  ensureEventOwnerOrAdmin,
  ensureProviderOrAdmin,
} from "../services/eventsAccess.js";
import { auditEvent } from "../services/audit.js";
import { isAdminUser, getUserId } from "../services/authz.js";
import { enqueueDomainEvent } from "../services/outbox.js"; // 👈 nou

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({
    send: (body) => res.status(status).json(body),
  });
  return f;
}

export async function invitationsRoutes(app) {
  // ------------------------------------------------------------------
  // 1. List invitații pentru un eveniment (owner/admin)
  // ------------------------------------------------------------------
  app.get("/events/:eventId/invitations", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ev = await ensureEventOwnerOrAdmin(
      user,
      req.params.eventId,
      reply
    );
    if (!ev) return;

    const rows = await prisma.eventInvitation.findMany({
      where: { eventId: ev.id },
      include: {
        event: true,
        // legătură opțională cu EventNeed (dacă schema are relația "need")
        need: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return reply.send(rows);
  });

  // ------------------------------------------------------------------
  // 2. Detaliu invitație pt. un eveniment (owner/admin) + ofertele aferente
  // ------------------------------------------------------------------
  app.get("/events/:eventId/invitations/:id", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId, id } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev) return;

    const inv = await prisma.eventInvitation.findUnique({
      where: { id },
      include: {
        need: true,
      },
    });

    if (!inv || inv.eventId !== ev.id) {
      return reply
        .code(404)
        .send({ error: "Invitation not found for this event" });
    }

    const offers = await prisma.eventOffer.findMany({
      where: {
        eventId: ev.id,
        invitationId: inv.id,
      },
      orderBy: { createdAt: "desc" },
    });

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

  // ------------------------------------------------------------------
  // 3. Creează invitație single (owner/admin)
  // ------------------------------------------------------------------
  app.post("/events/:eventId/invitations", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ev = await ensureEventOwnerOrAdmin(
      user,
      req.params.eventId,
      reply
    );
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
      needId,
    } = req.body || {};

    if (!providerId && !providerGroupId) {
      return reply
        .code(400)
        .send({ error: "Either providerId or providerGroupId is required" });
    }

    const inv = await prisma.eventInvitation.create({
      data: {
        eventId: ev.id,
        clientId: ev.clientId,
        providerId: providerId || null,
        providerGroupId: providerGroupId || null,
        note: note || message || null,
        roleHint: roleHint || null,
        replyDeadline: replyDeadline ? new Date(replyDeadline) : null,
        needId: needId || null,
        proposedBudget:
          proposedBudget != null && proposedBudget !== ""
            ? Number(proposedBudget)
            : null,
        budgetCurrency: budgetCurrency || ev.currency || null,
      },
    });
    auditEvent("invitation.created", {
      actorId: user?.userId || user?.id || null,
      eventId: ev.id,
      invitationId: inv.id,
      clientId: inv.clientId,
      providerId: inv.providerId,
      providerGroupId: inv.providerGroupId,
      needId: inv.needId,
      replyDeadline: inv.replyDeadline,
      proposedBudget: inv.proposedBudget,
      budgetCurrency: inv.budgetCurrency,
    });
    await enqueueDomainEvent({
      aggregateType: "EventInvitation",
      aggregateId: inv.id,
      type: "events.precontract.invitation.created",
      payload: {
        eventId: ev.id,
        invitationId: inv.id,
        clientId: inv.clientId,
        providerId: inv.providerId,
        providerGroupId: inv.providerGroupId,
        needId: inv.needId,
        replyDeadline: inv.replyDeadline,
        proposedBudget: inv.proposedBudget,
        budgetCurrency: inv.budgetCurrency,
        status: inv.status,
        source: "SINGLE",
      },
    });


    return reply.send(inv);
  });

  // ------------------------------------------------------------------
  // 4. Creează invitații în bulk către mai mulți provideri
  // ------------------------------------------------------------------
  app.post("/events/:eventId/invitations/bulk", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ev = await ensureEventOwnerOrAdmin(
      user,
      req.params.eventId,
      reply
    );
    if (!ev) return;

    const { providerIds, note, proposedBudget, budgetCurrency, needId } =
      req.body || {};

    if (!Array.isArray(providerIds) || providerIds.length === 0) {
      return reply
        .code(400)
        .send({ error: "providerIds must be a non-empty array" });
    }

    const ids = Array.from(
      new Set(
        providerIds
          .map((id) => (id == null ? null : String(id).trim()))
          .filter((id) => !!id)
      )
    );

    if (!ids.length) {
      return reply.code(400).send({ error: "No valid providerIds" });
    }

    try {
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
        needId: needId || null,
        proposedBudget:
          proposedBudget != null && proposedBudget !== ""
            ? Number(proposedBudget)
            : null,
        budgetCurrency: budgetCurrency || ev.currency || null,
      }));

      const result = await prisma.eventInvitation.createMany({
        data,
        skipDuplicates: true,
      });

      auditEvent("invitation.bulkCreated", {
        actorId: user?.userId || user?.id || null,
        eventId: ev.id,
        providerIds: toCreate.map((row) => row.providerId).filter(Boolean),
        groupIds: toCreate
          .map((row) => row.providerGroupId)
          .filter(Boolean),
        needId: needId || null,
        createdCount: result.count ?? toCreate.length,
        skippedCount: ids.length - toCreate.length,
        totalRequested: ids.length,
      });

            await enqueueDomainEvent({
        aggregateType: "Event",
        aggregateId: ev.id,
        type: "events.precontract.invitation.bulkCreated",
        payload: {
          eventId: ev.id,
          clientId: ev.clientId,
          providerIds: toCreate, // lista efectivă de providerIds create
          needId: needId || null,
          proposedBudget:
            proposedBudget != null && proposedBudget !== ""
              ? Number(proposedBudget)
              : null,
          budgetCurrency: budgetCurrency || ev.currency || null,
          createdCount: result.count ?? toCreate.length,
          totalRequested: ids.length,
        },
      });

      return reply.send({
        createdCount: result.count ?? toCreate.length,
        skippedCount: ids.length - toCreate.length,
        totalRequested: ids.length,
      });
    } catch (err) {
      console.error("Error creating bulk invitations:", err);
      return reply
        .code(500)
        .send({ error: "Database error creating invitations" });
    }
  });

  // ------------------------------------------------------------------
  // 5. Provider: list invitațiile mele + sumar eveniment + need
  // ------------------------------------------------------------------
  app.get("/providers/me/invitations", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const page = Number(req.query.page || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize || 20));

    const providerUserId = String(user.userId || user.id);

    const [rows, total] = await Promise.all([
      prisma.eventInvitation.findMany({
        where: { providerId: providerUserId },
        include: {
          // legăm EventNeed-ul
          need: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.eventInvitation.count({
        where: { providerId: providerUserId },
      }),
    ]);

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
          currency: true,
        },
      });
      eventsById = Object.fromEntries(events.map((e) => [e.id, e]));
    }

    const rowsWithEvent = rows.map((r) => ({
      ...r,
      event: eventsById[r.eventId] || null,
    }));

    return reply.send({ rows: rowsWithEvent, total, page, pageSize });
  });

  // ------------------------------------------------------------------
  // 6. Provider: detaliu invitație proprie (include eveniment)
  // ------------------------------------------------------------------
  app.get("/providers/me/invitations/:id", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    if (!user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const inv = await prisma.eventInvitation.findUnique({
      where: { id },
      include: {
        event: true,
        need: true,
      },
    });

    if (!inv) {
      return reply.code(404).send({ error: "Invitation not found" });
    }

    const roles = user.roles || [];
    const isAdmin = isAdminUser(user);
    const providerUserId = getUserId(user);

    const isClient =
      String(inv.clientId) === String(user.id) ||
      String(inv.clientId) === String(user.clientId);

    const isProvider = String(inv.providerId) === providerUserId;

    if (!isAdmin && !isClient && !isProvider) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    return reply.send(inv);
  });

  // ------------------------------------------------------------------
  // 7. Provider: accept/decline invitație
  // ------------------------------------------------------------------
  app.post("/invitations/:id/decision", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const { id } = req.params;
    const { decision } = req.body || {};

    const inv = await prisma.eventInvitation.findUnique({ where: { id } });
    if (!inv) {
      return reply.code(404).send({ error: "Invitation not found" });
    }

    const roles = user.roles || [];
    const providerUserId = getUserId(user);
    const isAdmin = isAdminUser(user);

    if (!isAdmin && String(inv.providerId) !== providerUserId) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const normalized = String(decision || "").toUpperCase();
    if (!["ACCEPTED", "DECLINED"].includes(normalized)) {
      return reply
        .code(400)
        .send({ error: "decision must be ACCEPTED or DECLINED" });
    }

    const upd = await prisma.eventInvitation.update({
      where: { id },
      data: { status: normalized, decidedAt: new Date() },
    });

    auditEvent("invitation.decision", {
      actorId: providerUserId,
      eventId: inv.eventId,
      invitationId: inv.id,
      providerId: inv.providerId,
      decision: normalized,
    });

        await enqueueDomainEvent({
      aggregateType: "EventInvitation",
      aggregateId: inv.id,
      type: "events.precontract.invitation.decision",
      payload: {
        eventId: inv.eventId,
        invitationId: inv.id,
        providerId: inv.providerId,
        providerGroupId: inv.providerGroupId,
        needId: inv.needId,
        decision: normalized,
        status: upd.status,
        decidedAt: upd.decidedAt,
      },
    });

    // logica de buget la ACCEPTED se face la nivel de OFFER, nu de invitație
    return reply.send(upd);

  });
}
