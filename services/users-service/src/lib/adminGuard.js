// services/users-service/src/lib/adminGuard.js
const logger = require('./logger');
const { authMe } = require('./authClient');

async function requireAdmin(request, reply) {
  try {
    const cookie = request.headers.cookie || '';
    if (!cookie) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }

    const me = await authMe(cookie); // GET http://auth/auth/me
    if (!me || !me.role || me.role.toLowerCase() !== 'admin') {
      return reply.code(403).send({ message: 'Admin only' });
    }

    request.user = {
      id: me.id,
      email: me.email,
      role: me.role,
    };
  } catch (err) {
    logger.error({ err }, 'requireAdmin failed');
    return reply.code(401).send({ message: 'Unauthorized' });
  }
}

module.exports = { requireAdmin };
