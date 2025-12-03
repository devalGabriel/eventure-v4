// services/events-service/src/routes/guestbook.js
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

export default function guestbookRoutes(app) {
  // GET /events/:eventId/guestbook
  // Owner/Admin văd toate intrările din guestbook
  app.get("/events/:eventId/guestbook", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev) return;

    const entries = await prisma.eventGuestbookEntry.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });

    return reply.send(entries);
  });

  // POST /events/:eventId/guestbook
  // Momentan permitem doar owner/admin să adauge mesaje în guestbook
  // (ulterior poți deschide pentru invitați/public cu un token)
  app.post("/events/:eventId/guestbook", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId } = req.params;
    const body = req.body || {};

    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev) return;

    const authorName = (body.authorName || "").trim();
    const message = (body.message || "").trim();

    if (!authorName || !message) {
      return reply
        .code(400)
        .send({ error: "authorName și message sunt obligatorii" });
    }

    const entry = await prisma.eventGuestbookEntry.create({
      data: {
        eventId,
        authorName,
        message,
        createdByUserId: user.userId?.toString() || user.id?.toString() || null,
      },
    });

    return reply.code(201).send(entry);
  });

  // DELETE /events/:eventId/guestbook/:entryId
  // Owner/Admin pot șterge o intrare din guestbook (ex. mesaje nepotrivite)
  app.delete("/events/:eventId/guestbook/:entryId", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId, entryId } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev) return;

    const existing = await prisma.eventGuestbookEntry.findUnique({
      where: { id: entryId },
    });

    if (!existing || existing.eventId !== eventId) {
      return reply.code(404).send({ error: "Guestbook entry not found" });
    }

    await prisma.eventGuestbookEntry.delete({ where: { id: entryId } });

    return reply.send({ ok: true });
  });
}
