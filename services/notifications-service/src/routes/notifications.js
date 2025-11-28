// services/notifications-service/src/routes/notifications.js
module.exports = async function routes(fastify) {
  const { prisma } = fastify;

  /**
   * GET /v1/notifications?authUserId=&status=&limit=
   * Lista notificărilor pentru un utilizator (folosită de UI).
   */
  fastify.get('/v1/notifications', async (req) => {
    const authUserId =
      req.query.authUserId ||
      req.query.userId ||
      req.headers['x-auth-user-id'] ||
      req.headers['x-user-id'];

    if (!authUserId) return [];

    const where = { authUserId: String(authUserId) };
    if (req.query.status) {
      where.status = String(req.query.status).toUpperCase();
    }

    const limit =
      Number(req.query.limit) > 0 && Number(req.query.limit) <= 100
        ? Number(req.query.limit)
        : 50;

    const items = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return items;
  });

  /**
   * POST /v1/notifications/mark-read
   * Body:
   *  - authUserId / userId (obligatoriu)
   *  - ids?: string[]
   *  - all?: boolean
   *
   * Marcare clasică ca "citit" după id sau pentru toate.
   */
  fastify.post('/v1/notifications/mark-read', async (req) => {
    const authUserId =
      req.body.authUserId ||
      req.body.userId ||
      req.headers['x-auth-user-id'] ||
      req.headers['x-user-id'];

    if (!authUserId) return { updated: 0 };

    const where = { authUserId: String(authUserId) };
    const { ids, all } = req.body || {};

    let result;
    if (all) {
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

  /**
   * POST /v1/notifications/mark-read-context
   * Body:
   *  - authUserId / userId (obligatoriu)
   *  - context:
   *      - eventId?: string
   *      - offerId?: string
   *
   * Folosit de UI mesagerie pentru a marca toate notificările
   * EVENT_MESSAGE legate de un anumit eveniment/ofertă ca fiind citite
   * în momentul în care utilizatorul deschide thread-ul.
   */
  fastify.post('/v1/notifications/mark-read-context', async (req, reply) => {
    const authUserId =
      req.body.authUserId ||
      req.body.userId ||
      req.headers['x-auth-user-id'] ||
      req.headers['x-user-id'];

    if (!authUserId) return { updated: 0 };

    const { context } = req.body || {};
    const eventId = context?.eventId;
    const offerId = context?.offerId;

    if (!eventId && !offerId) {
      return reply.badRequest('Missing eventId/offerId context');
    }

    const and = [];

    if (eventId) {
      and.push({
        data: {
          path: ['eventId'],
          equals: eventId,
        },
      });
    }

    if (offerId) {
      and.push({
        data: {
          path: ['offerId'],
          equals: offerId,
        },
      });
    }

    const where = {
      authUserId: String(authUserId),
      type: 'EVENT_MESSAGE',
      ...(and.length ? { AND: and } : {}),
    };

    const result = await prisma.notification.updateMany({
      where,
      data: { status: 'READ', readAt: new Date() },
    });

    return { updated: result.count };
  });
};
