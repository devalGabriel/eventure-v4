// services/events-service/src/routes/offers.js
import { prisma } from '../db.js';
import { ensureEventOwnerOrAdmin, ensureProviderOrAdmin } from '../services/eventsAccess.js';

// adapter mic pentru a păstra semantica Fastify reply pe Express
function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({ send: (body) => res.status(status).json(body) });
  return f;
}

export async function offersRoutes(app) {
  // Provider: lista ofertelor mele (toate evenimentele)
  app.get('/offers', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const page = Number(req.query.page || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize || 20));
    const status = req.query.status ? String(req.query.status) : undefined;

    const where = { providerId: user.userId, ...(status ? { status } : {}) };

    const [rows, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.offer.count({ where })
    ]);
    return reply.send({ rows, total, page, pageSize });
  });

  // Provider: create ofertă pentru un eveniment
  app.post('/events/:eventId/offers', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const { eventId } = req.params;
    // validăm existența evenimentului (owner/admin) — tu ai folosit ensureEventOwnerOrAdmin cu { ...user, role: 'admin' }
    await ensureEventOwnerOrAdmin({ ...user, role: 'admin' }, eventId, reply);

    const { title, description, price, currency, serviceGroupId } = req.body || {};
    if (!title || title.length < 2) return reply.code(400).send({ error: 'title required' });

    const created = await prisma.offer.create({
      data: {
        eventId,
        providerId: user.userId,
        serviceGroupId: serviceGroupId || null,
        title,
        description: description || null,
        price: price ? new prisma.Prisma.Decimal(price) : null,
        currency: currency || 'RON',
        status: 'DRAFT'
      }
    });
    return reply.send(created);
  });

  // Client: listă oferte pe eveniment (owner/admin)
  app.get('/events/:eventId/offers', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ev = await ensureEventOwnerOrAdmin(user, req.params.eventId, reply);
    if (!ev) return;

    const rows = await prisma.offer.findMany({
      where: { eventId: ev.id },
      orderBy: { createdAt: 'desc' }
    });
    return reply.send(rows);
  });

  // Provider: update ofertă (doar proprietarul ofertei sau admin)
  app.put('/offers/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const { id } = req.params;
    const of = await prisma.offer.findUnique({ where: { id } });
    if (!of) return reply.code(404).send({ error: 'Offer not found' });
    if (user.role !== 'admin' && of.providerId !== user.userId) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const { title, description, price, currency, status, serviceGroupId } = req.body || {};
    const upd = await prisma.offer.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(price !== undefined ? { price: price ? new prisma.Prisma.Decimal(price) : null } : {}),
        ...(currency ? { currency } : {}),
        ...(status ? { status } : {}),
        ...(serviceGroupId !== undefined ? { serviceGroupId: serviceGroupId || null } : {})
      }
    });
    return reply.send(upd);
  });

  // Client: accept/decline ofertă (owner/admin)
  app.post('/offers/:id/decision', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;
    const { decision } = req.body || {};

    const of = await prisma.offer.findUnique({ where: { id } });
    if (!of) return reply.code(404).send({ error: 'Offer not found' });

    const ev = await ensureEventOwnerOrAdmin(user, of.eventId, reply);
    if (!ev) return;

    if (!['ACCEPTED', 'DECLINED'].includes(String(decision || ''))) {
      return reply.code(400).send({ error: 'decision must be ACCEPTED or DECLINED' });
    }

    const upd = await prisma.offer.update({
      where: { id },
      data: { status: decision }
    });
    return reply.send(upd);
  });
}
