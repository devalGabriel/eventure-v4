// services/users-service/src/plugins/authenticate.js
const fp = require('fastify-plugin');
const jwt = require('jsonwebtoken');

async function authPlugin(fastify) {
  fastify.decorate('authenticate', async function (request, reply) {
    const auth =
      request.headers['authorization'] ||
      request.headers['Authorization'];

    if (!auth || !auth.startsWith('Bearer ')) {
      return reply.code(401).send({ message: 'Missing Bearer token' });
    }

    const token = auth.slice(7).trim();

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          process.env.ACCESS_TOKEN_SECRET ||
          'dev-secret'
      );

      const role = payload.role || null;

      request.user = {
        id: payload.id || payload.sub || payload.userId || null,
        email: payload.email || null,
        role, // "admin" / "client" / "provider"
        roles: Array.isArray(payload.roles)
          ? payload.roles
          : role
          ? [String(role).toUpperCase()]
          : [],
        raw: payload,
      };
    } catch (err) {
      request.log.warn({ err }, 'JWT verification failed');
      return reply.code(401).send({ message: 'Invalid token' });
    }
  });
}

module.exports = fp(authPlugin);
