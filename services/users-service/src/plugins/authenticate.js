// services/users-service/src/plugins/authenticate.js
const fp = require('fastify-plugin');
const jwt = require('jsonwebtoken');

async function authenticatePlugin(fastify) {
  fastify.decorate('authenticate', async function (request, reply) {
    const auth =
      request.headers['authorization'] ||
      request.headers['Authorization'];

    if (!auth || !auth.startsWith('Bearer ')) {
      return reply.code(401).send({ message: 'Missing token' });
    }

    const token = auth.slice('Bearer '.length);

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          process.env.ACCESS_TOKEN_SECRET ||
          'supersecret-dev'
      );

      // tokenul emis de auth-service are: { id, role, email, ... }
      const rolesFromToken = decoded.roles || (
        decoded.role ? [String(decoded.role).toUpperCase()] : []
      );

      request.user = {
        id: decoded.sub || decoded.id || decoded.userId || null,
        email: decoded.email || null,
        role: decoded.role || null,
        roles: rolesFromToken,
      };
    } catch (err) {
      request.log.error({ err }, 'JWT verify failed');
      return reply.code(401).send({ message: 'Invalid token' });
    }
  });
}

module.exports = fp(authenticatePlugin);
