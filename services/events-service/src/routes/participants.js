// services/events-service/src/routes/eventParticipants.js
import { prisma } from "../db.js";
import { ensureEventOwnerOrAdmin } from "../services/eventsAccess.js";

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({
    send: (body) => res.status(status).json(body),
  });
  return f;
}

// TODO: când avem endpoint clar în users-service,
// aici putem face lookup real de userId după email/telefon.
async function tryResolveUserIdByContact({ email, phone }) {
  // deocamdată doar schemă, nu facem call extern
  // return userId sau null
  return null;
}

export default function eventParticipantsRoutes(app) {
  // ---------------------------------------------------------
  // GET /events/:eventId/participants
  //  - lista de participanți pentru eveniment
  //  - îmbogățită cu date din users-service
  // ---------------------------------------------------------
  app.get("/events/:eventId/participants", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev) return;

    const participants = await prisma.eventParticipant.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
      include: {
        guestBookTokens: true,
      },
    });

    const userIds = [
      ...new Set(
        participants
          .map((p) => (p.userId == null ? null : String(p.userId)))
          .filter(Boolean)
      ),
    ];

    let usersById = {};
    if (userIds.length) {
      usersById = await fetchUsersByIds(userIds);
    }

    const result = participants.map((p) => {
      const u = usersById[String(p.userId)] || null;
      const displayName =
        u?.name || u?.displayName || u?.fullName || null;

      return {
        ...p,
        // câmpuri derivate pentru UI
        name: displayName,
        email: u?.email || null,
        phone: u?.phone || null,
        tokensCount: p.guestBookTokens.length,
        user: u
          ? {
              id: u.id,
              name: displayName,
              email: u.email || null,
              phone: u.phone || null,
            }
          : null,
      };
    });

    return reply.send(result);
  });

  // ---------------------------------------------------------
  // POST /events/:eventId/participants
  //  - adaugă participant pe bază de email/telefon
  //  - în această versiune: DOAR utilizatori existenți ai aplicației
  // ---------------------------------------------------------
  app.post("/events/:eventId/participants", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId } = req.params;
    const body = req.body || {};

    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev) return;

    const role = body.role || "CLIENT";
    const status = body.status || "INVITED";

    const email = (body.email || "").trim();
    const phone = (body.phone || "").trim();

    if (!email && !phone) {
      return reply
        .code(400)
        .send({ error: "Trebuie să specifici cel puțin email sau telefon" });
    }

    // identificare utilizator existent din users-service
    const foundUser = await lookupUserByEmailOrPhone({ email, phone });

    if (!foundUser || !foundUser.id) {
      return reply.code(404).send({
        error:
          "Nu am găsit niciun utilizator al aplicației cu acest email/telefon. " +
          "În această versiune, poți adăuga doar utilizatori existenți (client / provider).",
      });
    }

    const userId = String(foundUser.id);

    // evităm duplicarea aceluiași user/role pe eveniment
    const existing = await prisma.eventParticipant.findFirst({
      where: { eventId, userId, role },
    });

    if (existing) {
      return reply.code(200).send(existing);
    }

    const participant = await prisma.eventParticipant.create({
      data: {
        eventId,
        userId,
        role,
        status,
      },
    });

    return reply.code(201).send(participant);
  });

  // ---------------------------------------------------------
  // DELETE /events/:eventId/participants/:userId?role=...
  //  - șterge participantul (dacă nu are tokenuri de guestbook)
  // ---------------------------------------------------------
  app.delete("/events/:eventId/participants/:userId", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId, userId } = req.params;
    const role = (req.query.role || req.body?.role || "CLIENT").toString();

    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev) return;

    const existing = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId_role: {
          eventId,
          userId,
          role,
        },
      },
      include: { guestBookTokens: true },
    });

    if (!existing) {
      return reply
        .code(404)
        .send({ error: "Participant not found for this event" });
    }

    if (existing.guestBookTokens && existing.guestBookTokens.length > 0) {
      return reply.code(409).send({
        error:
          "Participantul are token-uri de guestbook; " +
          "revocă sau șterge token-urile înainte de a șterge participantul.",
      });
    }

    await prisma.eventParticipant.delete({
      where: {
        eventId_userId_role: {
          eventId,
          userId,
          role,
        },
      },
    });

    return reply.send({ ok: true });
  });
}
