// services/users-service/src/routes/users.js
const { userIdParam, updateProfileBody } = require('../lib/validators');
const { enqueueOutbox } = require('../lib/outbox');
const { OUT } = require('../lib/events');
const { mapUser, mapUsers } = require('../lib/dto');
const { diffKeys } = require('../lib/diff');

// verifică dacă request.user e admin (din JWT) sau avem header de dev
async function requireAdmin(request, reply) {
  const roleFromUser = request.user?.role;
  const rolesArr = request.user?.roles || [];
  const roleHeader = request.headers['x-user-role'];

  const isAdminToken =
    roleFromUser && String(roleFromUser).toLowerCase() === 'admin';

  const isAdminArray = rolesArr
    .map((r) => String(r).toUpperCase())
    .includes('ADMIN');

  const isAdminHeader =
    roleHeader && String(roleHeader).toUpperCase() === 'ADMIN';

  if (!(isAdminToken || isAdminArray || isAdminHeader)) {
    return reply.code(403).send({ message: 'Admin only' });
  }
}

async function routes(fastify) {
  const { prisma } = fastify;

  // GET /users/:id – după authUserId (id-ul din auth-service)
  fastify.get('/users/:id', async (req, reply) => {
    const { id } = req.params;
    try {
      const user = await prisma.userProfile.findUnique({
        where: { authUserId: String(id) },
        include: { roles: true },
      });
      if (!user) return reply.notFound('User not found');
      return mapUser(user);
    } catch (error) {
      req.log.error({ error }, 'error on GET /users/:id');
      return reply.internalServerError('Internal error');
    }
  });

  // GET /v1/users/:id – după UUID profil
  fastify.get('/v1/users/:id', async (req, reply) => {
    const { id } = userIdParam.parse(req.params);
    const user = await prisma.userProfile.findUnique({
      where: { id },
      include: { roles: true },
    });
    if (!user) return reply.notFound('User not found');
    return mapUser(user);
  });

  // GET /v1/users – listă generică (filtrare)
  fastify.get('/v1/users', async (req) => {
    const { query, role, active, page = '1', pageSize = '20' } = req.query;

    const where = {
      deletedAt: null,
      ...(typeof active === 'string' ? { isActive: active === 'true' } : {}),
    };

    if (query) {
      where.OR = [
        { email: { contains: query } },
        { fullName: { contains: query } },
        { phone: { contains: query } },
      ];
    }
    if (role) where.roles = { some: { name: role } };

    const take = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100);
    const currentPage = Math.max(parseInt(page) || 1, 1);
    const skip = (currentPage - 1) * take;

    const [total, items] = await Promise.all([
      prisma.userProfile.count({ where }),
      prisma.userProfile.findMany({
        where,
        include: { roles: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      page: currentPage,
      pageSize: take,
      total,
      count: items.length,
      items: mapUsers(items),
    };
  });

  // PATCH /v1/users/:id – update profil + AUDIT + OUTBOX (profile.updated)
  fastify.patch('/v1/users/:id', async (req, reply) => {
    const { id } = userIdParam.parse(req.params);
    const body = updateProfileBody.parse(req.body);

    const existing = await prisma.userProfile.findUnique({
      where: { id },
      include: { roles: true },
    });
    if (!existing) return reply.notFound('User not found');

    const updated = await prisma.userProfile.update({
      where: { id },
      data: { ...body },
      include: { roles: true },
    });

    const allowedKeys = ['fullName', "email",'phone', 'locale', 'avatarUrl', 'isActive'];
    const changed = diffKeys(existing, updated, allowedKeys);

    await prisma.userProfileAudit.create({
      data: {
        userId: id,
        actorId: req.headers['x-actor-id']?.toString() || null,
        event: 'PROFILE_UPDATED',
        changedKeys: changed,
        before: changed.length
          ? changed.reduce(
              (acc, k) => ({ ...acc, [k]: existing[k] }),
              {}
            )
          : null,
        after: changed.length
          ? changed.reduce(
              (acc, k) => ({ ...acc, [k]: updated[k] }),
              {}
            )
          : null,
      },
    });

    // Eveniment pentru auth-service & alții
    await enqueueOutbox(prisma, OUT.USERS_PROFILE_UPDATED, {
      authUserId: existing.authUserId,      // id din AUTH service
      profileId: id,                        // UUID-ul profilului
      changed,
      email: updated.email,
      fullName: updated.fullName,
      locale: updated.locale,
      phone: updated.phone,
      isActive: updated.isActive,
      at: new Date().toISOString(),
    });

    return mapUser(updated);
  });

  // DELETE (soft) + AUDIT + OUTBOX
  fastify.delete('/v1/users/:id', async (req) => {
    const { id } = userIdParam.parse(req.params);
    const before = await prisma.userProfile.findUnique({ where: { id } });
    await prisma.userProfile.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await prisma.userProfileAudit.create({
      data: {
        userId: id,
        actorId: req.headers['x-actor-id']?.toString() || null,
        event: 'USER_DELETED',
        changedKeys: ['deletedAt', 'isActive'],
        before: {
          isActive: before?.isActive ?? true,
          deletedAt: before?.deletedAt ?? null,
        },
        after: {
          isActive: false,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    await enqueueOutbox(prisma, OUT.USERS_DELETED, {
      userId: id,
      at: new Date().toISOString(),
    });
    return { ok: true };
  });

  // BULK FETCH: POST /v1/users/bulk { ids?: string[], emails?: string[] }
  fastify.post('/v1/users/bulk', async (req, reply) => {
    const { ids = [], emails = [] } = req.body || {};
    if ((!ids || !ids.length) && (!emails || !emails.length)) {
      return reply.badRequest('Provide ids or emails');
    }
    const items = await prisma.userProfile.findMany({
      where: {
        deletedAt: null,
        OR: [
          ...(ids?.length ? [{ id: { in: ids } }] : []),
          ...(emails?.length ? [{ email: { in: emails } }] : []),
        ],
      },
      include: { roles: true },
    });
    return { count: items.length, items: mapUsers(items) };
  });

  // --- ADMIN: list users (panel admin) ---
  fastify.get(
    '/v1/admin/users',
    {
      preHandler: [fastify.authenticate, requireAdmin],
    },
    async (request) => {
      const { role, q, page = 1, pageSize = 50 } = request.query || {};

      const take = Number(pageSize) || 50;
      const skip = (Number(page) - 1) * take;

      const where = {
        deletedAt: null,
        ...(role && role !== 'all'
          ? {
              roles: {
                some: {
                  name: role,
                },
              },
            }
          : {}),
        ...(q && q.trim()
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { fullName: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      };

      const [total, items] = await Promise.all([
        prisma.userProfile.count({ where }),
        prisma.userProfile.findMany({
          where,
          include: { roles: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ]);

      return {
        items: mapUsers(items),
        total,
        page: Number(page),
        pageSize: take,
      };
    }
  );

  // --- ADMIN: update rapid (deocamdată nu îl folosim, lăsat pentru viitor) ---
  fastify.patch(
    '/v1/admin/users/:id',
    {
      preHandler: [fastify.authenticate, requireAdmin],
    },
    async (request, reply) => {
      const { id } = userIdParam.parse(request.params);
      const { isActive } = request.body || {};
      const data = {};

      if (typeof isActive === 'boolean') {
        data.isActive = isActive;
      }

      if (Object.keys(data).length === 0) {
        return reply.badRequest('Nothing to update');
      }

      const updated = await prisma.userProfile.update({
        where: { id },
        data,
        include: { roles: true },
      });

      return mapUser(updated);
    }
  );

    // --- ADMIN: audit trail pentru un user ---
  fastify.get('/v1/admin/users/:id/audit', {
    preHandler: [fastify.authenticate, requireAdmin]
  }, async (request) => {
    const { id } = userIdParam.parse(request.params);

    const items = await prisma.userProfileAudit.findMany({
      where: { userId: id },
      orderBy: { at: 'desc' },
      take: 100
    });

    return { items };
  });

}

module.exports = routes;
