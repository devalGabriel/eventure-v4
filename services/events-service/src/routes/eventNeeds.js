import { prisma } from '../db.js';
import { BadRequest } from '../errors.js';
import { ensureEventOwnerOrAdmin } from '../services/eventsAccess.js';

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({ send: (body) => res.status(status).json(body) });
  return f;
}

export default function eventNeedsRoutes(app) {
  // GET /events/:eventId/needs
  app.get('/events/:eventId/needs', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev) return;

    const needs = await prisma.eventNeed.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });

    return reply.send(needs);
  });

  // PUT /events/:eventId/needs
  app.put('/events/:eventId/needs', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId } = req.params;
    const body = req.body || {};
    const items = Array.isArray(body.needs) ? body.needs : [];

    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev) return;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.eventNeed.findMany({
        where: { eventId },
      });

      const existingById = Object.fromEntries(
        existing.map((n) => [n.id, n])
      );
      const existingIds = existing.map((n) => n.id);

      // identificăm need-urile care au deja invitații / oferte sau sunt deja locked
      const [invites, offers] = await Promise.all([
        tx.eventInvitation.findMany({
          where: { needId: { in: existingIds } },
          select: { needId: true },
        }),
        tx.eventOffer.findMany({
          where: { needId: { in: existingIds } },
          select: { needId: true },
        }),
      ]);

      const lockedIds = new Set([
        ...existing.filter((n) => n.locked).map((n) => n.id),
        ...invites.map((i) => i.needId),
        ...offers.map((o) => o.needId),
      ]);

      const incomingIds = new Set(
        items
          .map((n) => (n.id ? String(n.id) : null))
          .filter(Boolean)
      );

      // ȘTERGERI
      for (const ex of existing) {
        if (!incomingIds.has(ex.id)) {
          if (lockedIds.has(ex.id)) {
            throw BadRequest(
              `Serviciul "${ex.label || ex.id}" nu poate fi șters, are deja invitații sau oferte.`
            );
          }
          await tx.eventNeed.delete({ where: { id: ex.id } });
        }
      }

      // CREARE / UPDATE
      for (const raw of items) {
        const id = raw.id ? String(raw.id) : null;

        const data = {
          eventId,
          label: raw.label || null,
          budgetPlanned:
            raw.budgetPlanned == null ? null : Number(raw.budgetPlanned),
          categoryId:
            raw.categoryId === undefined || raw.categoryId === '' ? null : raw.categoryId,
          subcategoryId:
            raw.subcategoryId === undefined || raw.subcategoryId === ''
              ? null
              : raw.subcategoryId,
          tagId:
            raw.tagId === undefined || raw.tagId === '' ? null : raw.tagId,
          notes: raw.notes || null,
          priority:
            typeof raw.priority === 'string' && raw.priority
              ? raw.priority.toUpperCase()
              : 'MEDIUM',
          mustHave: raw.mustHave === undefined ? true : !!raw.mustHave,
          offersDeadline:
            raw.offersDeadline && raw.offersDeadline !== ''
              ? new Date(raw.offersDeadline)
              : null,
        };

        if (id && existingById[id]) {
          if (lockedIds.has(id)) {
            throw BadRequest(
              `Serviciul "${existingById[id].label || id}" nu mai poate fi modificat, are deja invitații sau oferte.`
            );
          }
          await tx.eventNeed.update({
            where: { id },
            data,
          });
        } else {
          await tx.eventNeed.create({ data });
        }
      }
    });

    const all = await prisma.eventNeed.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });

    return reply.send(all);
  });
}
