// services/events-service/src/routes/groups.js
import { prisma } from '../db.js';
import { BadRequest, NotFound } from '../errors.js';
import { ensureProviderAccess } from '../services/providerAccess.js';
import { isAdminUser, getUserId } from '../services/authz.js';

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({ send: (body) => res.status(status).json(body) });
  return f;
}

export async function groupsRoutes(app) {
  app.get('/groups', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderAccess(user, reply);
    if (!ok) return;

    const page = Number(req.query.page || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize || 20));
    const ownerId = getUserId(user);
    const where = isAdminUser(user) ? {} : { ownerId };

    const [rows, total] = await Promise.all([
      prisma.serviceGroup.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { members: true },
      }),
      prisma.serviceGroup.count({ where }),
    ]);

    return reply.send({ rows, total, page, pageSize });
  });

  app.post('/groups', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderAccess(user, reply);
    if (!ok) return;

    const { name, description, price, currency, status } = req.body || {};
    if (!name || name.length < 2) throw BadRequest('name is required');

    const ownerId = getUserId(user);

    const created = await prisma.serviceGroup.create({
      data: {
        ownerId,
        name,
        description: description || null,
        price: price ? new prisma.Prisma.Decimal(price) : null,
        currency: currency || 'RON',
        status: status || 'ACTIVE',
      },
    });
    return reply.send(created);
  });

  app.get('/groups/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderAccess(user, reply);
    if (!ok) return;

    const { id } = req.params;
    const g = await prisma.serviceGroup.findUnique({
      where: { id },
      include: { members: true },
    });
    if (!g) throw NotFound('Group not found');

    const ownerId = getUserId(user);
    if (!isAdminUser(user) && g.ownerId !== ownerId) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    return reply.send(g);
  });

  app.put('/groups/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderAccess(user, reply);
    if (!ok) return;

    const { id } = req.params;
    const g = await prisma.serviceGroup.findUnique({ where: { id } });
    if (!g) throw NotFound('Group not found');

    const ownerId = getUserId(user);
    if (!isAdminUser(user) && g.ownerId !== ownerId) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const { name, description, price, currency, status } = req.body || {};
    const updated = await prisma.serviceGroup.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(price !== undefined
          ? { price: price ? new prisma.Prisma.Decimal(price) : null }
          : {}),
        ...(currency ? { currency } : {}),
        ...(status ? { status } : {}),
      },
    });
    return reply.send(updated);
  });

  app.delete('/groups/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderAccess(user, reply);
    if (!ok) return;

    const { id } = req.params;
    const g = await prisma.serviceGroup.findUnique({ where: { id } });
    if (!g) throw NotFound('Group not found');

    const ownerId = getUserId(user);
    if (!isAdminUser(user) && g.ownerId !== ownerId) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    await prisma.groupMember.deleteMany({ where: { groupId: id } });
    await prisma.serviceGroup.delete({ where: { id } });
    return reply.send({ ok: true });
  });

  app.post('/groups/:id/members', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderAccess(user, reply);
    if (!ok) return;

    const { id } = req.params;
    const { userId, role, note } = req.body || {};
    if (!userId) throw BadRequest('userId required');

    const g = await prisma.serviceGroup.findUnique({ where: { id } });
    if (!g) throw NotFound('Group not found');

    const ownerId = getUserId(user);
    if (!isAdminUser(user) && g.ownerId !== ownerId) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const created = await prisma.groupMember.create({
      data: {
        groupId: id,
        userId,
        role: role || null,
        note: note || null,
      },
    });
    return reply.send(created);
  });

  app.delete('/groups/:id/members/:memberId', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderAccess(user, reply);
    if (!ok) return;

    const { id, memberId } = req.params;
    const g = await prisma.serviceGroup.findUnique({ where: { id } });
    if (!g) throw NotFound('Group not found');

    const ownerId = getUserId(user);
    if (!isAdminUser(user) && g.ownerId !== ownerId) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    await prisma.groupMember.delete({ where: { id: memberId } });
    return reply.send({ ok: true });
  });
}
