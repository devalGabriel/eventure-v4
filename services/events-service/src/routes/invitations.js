// services/events-service/src/routes/invitations.js
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

  // Creează invitație (owner/admin)
  app.post('/events/:eventId/invitations', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ev = await ensureEventOwnerOrAdmin(user, req.params.eventId, reply);
    if (!ev) return;

    const { providerId, note } = req.body || {};
    if (!providerId) return reply.code(400).send({ error: 'providerId required' });

    const inv = await prisma.eventInvitation.create({
      data: {
        eventId: ev.id,
        clientId: ev.ownerId,
        providerId,
        note: note || null
      }
    });
    return reply.send(inv);
  });

  // Provider: list invitațiile mele (toate evenimentele)
  app.get('/providers/me/invitations', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const page = Number(req.query.page || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize || 20));

    const [rows, total] = await Promise.all([
      prisma.eventInvitation.findMany({
        where: { providerId: user.userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.eventInvitation.count({ where: { providerId: user.userId } })
    ]);

    return reply.send({ rows, total, page, pageSize });
  });

  // Provider: accept/decline
  app.post('/invitations/:id/decision', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const { id } = req.params;
    const { decision } = req.body || {};

    const inv = await prisma.eventInvitation.findUnique({ where: { id } });
    if (!inv) return reply.code(404).send({ error: 'Invitation not found' });
    if (user.role !== 'admin' && inv.providerId !== user.userId) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    if (!['ACCEPTED', 'DECLINED'].includes(String(decision || ''))) {
      return reply.code(400).send({ error: 'decision must be ACCEPTED or DECLINED' });
    }

    const upd = await prisma.eventInvitation.update({
      where: { id },
      data: { status: decision, decidedAt: new Date() }
    });

    return reply.send(upd);
  });
}
