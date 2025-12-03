// services/events-service/src/routes/guestbookPublic.js
import { prisma } from "../db.js";

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({
    send: (body) => res.status(status).json(body),
  });
  return f;
}

async function resolveToken(tokenStr) {
  const token = await prisma.eventGuestbookToken.findUnique({
    where: { token: tokenStr },
    include: {
      event: true,
    },
  });
  if (!token) return null;

  // status & expirare
  if (token.status !== "ACTIVE") return null;
  if (token.expiresAt && token.expiresAt.getTime() < Date.now()) return null;
  if (
    token.maxUses !== null &&
    token.maxUses !== undefined &&
    token.usedCount >= token.maxUses
  ) {
    return null;
  }

  return token;
}

export default function guestbookPublicRoutes(app) {
  // GET /guestbook/public/:token
  // -> returnează info public eveniment + configurare guestbook + ultimele mesaje (opțional)
  app.get("/guestbook/public/:token", async (req, res) => {
    const reply = makeReply(res);
    const { token: tokenStr } = req.params;

    const token = await resolveToken(tokenStr);
    if (!token) {
      return reply.code(404).send({ error: "Guestbook link invalid or expired" });
    }

    // ultimele X mesaje (de ex. 50)
    let entries = [];
    if (token.canRead) {
      entries = await prisma.eventGuestbookEntry.findMany({
        where: { eventId: token.eventId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }

    // info minimal eveniment pentru header
    const ev = token.event;

    return reply.send({
      event: {
        id: ev.id,
        name: ev.name,
        type: ev.type,
        date: ev.date,
        city: ev.city,
        location: ev.location,
      },
      token: {
        type: token.type,
        canRead: token.canRead,
        canWrite: token.canWrite,
        nameHint: token.nameHint,
      },
      entries,
    });
  });

  // POST /guestbook/public/:token/messages
  // -> scrie mesaj în guestbook folosind tokenul (fără auth)
  app.post("/guestbook/public/:token/messages", async (req, res) => {
    const reply = makeReply(res);
    const { token: tokenStr } = req.params;
    const body = req.body || {};

    const token = await resolveToken(tokenStr);
    if (!token) {
      return reply.code(404).send({ error: "Guestbook link invalid or expired" });
    }

    if (!token.canWrite) {
      return reply.code(403).send({ error: "Guestbook is read-only for this link" });
    }

    const msg = (body.message || "").trim();
    let authorName = (body.authorName || "").trim();

    // PARTICIPANT / EMAIL – putem forța nameHint ca autor
    if (token.type === "PARTICIPANT" && token.nameHint) {
      authorName = token.nameHint;
    }

    if (!authorName || !msg) {
      return reply
        .code(400)
        .send({ error: "authorName și message sunt obligatorii" });
    }

    const entry = await prisma.eventGuestbookEntry.create({
      data: {
        eventId: token.eventId,
        authorName,
        message: msg,
        tokenId: token.id,
        createdByUserId: null,
      },
    });

    // incrementăm usedCount (simplu – 1 mesaj = 1 folosire)
    await prisma.eventGuestbookToken.update({
      where: { id: token.id },
      data: {
        usedCount: { increment: 1 },
      },
    });

    return reply.code(201).send(entry);
  });
}
