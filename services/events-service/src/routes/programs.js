// services/events-service/src/routes/programs.js
import { prisma } from '../db.js';
import { ensureEventOwnerOrAdmin } from '../services/eventsAccess.js';

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({ send: (body) => res.status(status).json(body) });
  return f;
}

export async function programsRoutes(app) {
  // List slots
  app.get('/events/:eventId/programs', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ev = await ensureEventOwnerOrAdmin(user, req.params.eventId, reply);
    if (!ev) return;

    const rows = await prisma.eventProgram.findMany({
      where: { eventId: ev.id },
      orderBy: { startsAt: 'asc' }
    });
    return reply.send(rows);
  });

  // Create slot
  app.post('/events/:eventId/programs', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ev = await ensureEventOwnerOrAdmin(user, req.params.eventId, reply);
    if (!ev) return;

    const { title, startsAt, endsAt, note } = req.body || {};
    if (!title || !startsAt) return reply.code(400).send({ error: 'title & startsAt required' });

    const created = await prisma.eventProgram.create({
      data: {
        eventId: ev.id,
        title,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        note: note || null
      }
    });
    return reply.send(created);
  });

  // Update slot
  app.put('/programs/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const pr = await prisma.eventProgram.findUnique({ where: { id } });
    if (!pr) return reply.code(404).send({ error: 'Program slot not found' });

    const ev = await ensureEventOwnerOrAdmin(user, pr.eventId, reply);
    if (!ev) return;

    const { title, startsAt, endsAt, note } = req.body || {};
    const upd = await prisma.eventProgram.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
        ...(endsAt !== undefined ? { endsAt: endsAt ? new Date(endsAt) : null } : {}),
        ...(note !== undefined ? { note } : {})
      }
    });
    return reply.send(upd);
  });

  // Delete slot
  app.delete('/programs/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;
    const pr = await prisma.eventProgram.findUnique({ where: { id } });
    if (!pr) return reply.code(404).send({ error: 'Program slot not found' });

    const ev = await ensureEventOwnerOrAdmin(user, pr.eventId, reply);
    if (!ev) return;

    await prisma.eventProgram.delete({ where: { id } });
    return reply.send({ ok: true });
  });
}
