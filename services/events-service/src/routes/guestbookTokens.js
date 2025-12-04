// services/events-service/src/routes/guestbookTokens.js
import { prisma } from "../db.js";
import { ensureEventOwnerOrAdmin } from "../services/eventsAccess.js";
import {
  fetchUsersByIds,
  lookupUserByEmailOrPhone,
} from "../services/usersClient.js";

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({
    send: (body) => res.status(status).json(body),
  });
  return f;
}

function generateTokenString() {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  );
}

export default function guestbookTokensRoutes(app) {
  // ---------------------------------------------------------
  // GET /events/:eventId/guestbook/tokens
  // ---------------------------------------------------------
  app.get("/events/:eventId/guestbook/tokens", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev) return;

    const tokens = await prisma.eventGuestbookToken.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });

    return reply.send(tokens);
  });

  // ---------------------------------------------------------
  // POST /events/:eventId/guestbook/tokens
  //  - creează token generic / participant / email
  // ---------------------------------------------------------
  app.post("/events/:eventId/guestbook/tokens", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId } = req.params;
    const body = req.body || {};

    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev) return;

    const type = (body.type || "GENERIC").toUpperCase();
    const allowedTypes = ["GENERIC", "PARTICIPANT", "EMAIL"];
    if (!allowedTypes.includes(type)) {
      return reply.code(400).send({ error: "Invalid token type" });
    }

    const baseData = {
      eventId,
      token: generateTokenString(),
      type,
      status: "ACTIVE",
      canRead: body.canRead !== false,
      canWrite: body.canWrite !== false,
      maxUses:
        body.maxUses === null || body.maxUses === undefined
          ? null
          : Number(body.maxUses),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      nameHint: body.nameHint || null,
      email: body.email || null,
      // default fără participant legat
      participantUserId: null,
      participantRole: null,
    };

    // Token specific pentru PARTICIPANT -> legăm de EventParticipant (userId + role)
    if (type === "PARTICIPANT") {
      const participantUserId =
        body.participantUserId || body.participantId || null;
      const participantRole = body.participantRole || null;

      if (!participantUserId || !participantRole) {
        return reply.code(400).send({
          error:
            "Pentru token de tip PARTICIPANT sunt necesare participantUserId și participantRole",
        });
      }

      // validare: participantul există pe acest eveniment
      const participant = await prisma.eventParticipant.findUnique({
        where: {
          eventId_userId_role: {
            eventId,
            userId: String(participantUserId),
            role: participantRole,
          },
        },
      });

      if (!participant) {
        return reply
          .code(404)
          .send({ error: "Participant not found for this event" });
      }

      baseData.participantUserId = String(participantUserId);
      baseData.participantRole = participantRole;

      // dacă nu există nameHint/email în payload, le putem completa ulterior (din users-service)
      // dar pentru moment, UI trimite nameHint, deci nu e obligatoriu.
    }

    const created = await prisma.eventGuestbookToken.create({
      data: baseData,
    });

    return reply.code(201).send(created);
  });

  // ---------------------------------------------------------
  // PATCH /events/:eventId/guestbook/tokens/:tokenId
  //  - schimbă status / drepturi / expirare
  // ---------------------------------------------------------
  app.patch("/events/:eventId/guestbook/tokens/:tokenId", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId, tokenId } = req.params;
    const body = req.body || {};

    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev) return;

    const existing = await prisma.eventGuestbookToken.findUnique({
      where: { id: tokenId },
    });
    if (!existing || existing.eventId !== eventId) {
      return reply
        .code(404)
        .send({ error: "Guestbook token not found for this event" });
    }

    const data = {};
    if (body.status) data.status = body.status;
    if (body.canRead !== undefined) data.canRead = !!body.canRead;
    if (body.canWrite !== undefined) data.canWrite = !!body.canWrite;
    if (body.maxUses !== undefined) data.maxUses = body.maxUses;
    if (body.expiresAt !== undefined) {
      data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    const updated = await prisma.eventGuestbookToken.update({
      where: { id: tokenId },
      data,
    });

    return reply.send(updated);
  });
}
