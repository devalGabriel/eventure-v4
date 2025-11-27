// services/notifications-service/src/routes/notifications.js
module.exports = async function routes(fastify) {
  const { prisma } = fastify;

  // GET /v1/notifications?authUserId=&status=&limit=
  fastify.get('/v1/notifications', async (req) => {
    const authUserId =
      req.query.authUserId ||
      req.query.userId ||
      req.headers['x-auth-user-id'] ||
      req.headers['x-user-id'];

    if (!authUserId) return [];

    const where = { authUserId: String(authUserId) };
    if (req.query.status) {
      where.status = String(req.query.status);
    }

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const items = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return items.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.body, // body -> message pentru UI
      read: n.status === 'READ' || !!n.readAt,
      readAt: n.readAt,
      createdAt: n.createdAt,
      meta: n.data || null,
      type: n.type || null,
    }));
  });

  // PATCH /v1/notifications/:id/read
  fastify.patch('/v1/notifications/:id/read', async (req) => {
    console.log('Received request to mark notification as read >>>>>>>>> HIT <<<<<<<<<<<<<');
    const { id } = await req.params;
    console.log('Marking notification as read, id:', id);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    try {
      const updated = await prisma.notification.update({
      where: { id },
      data: { status: 'READ', readAt: new Date() },
    });

    return {
      id: updated.id,
      title: updated.title,
      message: updated.body,
      read: true,
      readAt: updated.readAt,
      createdAt: updated.createdAt,
      meta: updated.data || null,
      type: updated.type || null,
    };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { error: 'Failed to mark notification as read' };
    }
  });

  // POST /v1/notifications/mark-read
  // body: { authUserId?: string, all?: boolean, ids?: string[] }
  fastify.post('/v1/notifications/mark-read', async (req) => {
    const { authUserId, all, ids } = req.body || {};
    const target =
      authUserId ||
      req.headers['x-auth-user-id'] ||
      req.headers['x-user-id'];

    if (!target) {
      return { updated: 0 };
    }

    const where = { authUserId: String(target) };
    let result;

    if (all) {
      // 🧠 marchez toate notificările userului ca "READ"
      result = await prisma.notification.updateMany({
        where,
        data: { status: 'READ', readAt: new Date() },
      });
    } else if (Array.isArray(ids) && ids.length) {
      result = await prisma.notification.updateMany({
        where: { ...where, id: { in: ids } },
        data: { status: 'READ', readAt: new Date() },
      });
    } else {
      return { updated: 0 };
    }

    return { updated: result.count };
  });
};
