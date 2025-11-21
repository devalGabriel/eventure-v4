// services/notifications-service/src/routes/internal.js
module.exports = async function routes(fastify) {
  const { prisma } = fastify;

  // POST /internal/notify  { authUserId, title, body, data? }
  fastify.post('/internal/notify', async (req, reply) => {
    const { authUserId, title, body, data, type } = req.body || {};
    if (!authUserId || !title || !body) return reply.badRequest('Missing fields');

    const n = await prisma.notification.create({
      data: { authUserId: String(authUserId), title, body, data: data || {}, type: type || 'SYSTEM' }
    });

    // aici vei trimite WS/push; momentan doar returnăm
    return n;
  });
};
