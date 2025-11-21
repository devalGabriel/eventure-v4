// services/providers-service/src/lib/auth.js
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

export default fp(async function authPlugin(fastify) {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'supersecretkey123'
  });

  fastify.decorate('authenticate', async function (req, reply) {
    try {
      await req.jwtVerify();
    } catch (err) {
      fastify.log.error({ err }, 'JWT verification failed');
      return reply.code(401).send({ message: 'Unauthorized' });
    }
  });

  fastify.decorate('requireRole', function requireRole(required) {
    const requiredRoles = Array.isArray(required) ? required : [required];

    return async function (req, reply) {
      const roles = req.user?.roles || req.user?.role || [];

      // LOG DEBUG
      fastify.log.info(
        { user: req.user, roles, requiredRoles },
        'requireRole check'
      );

      const rolesArr = (Array.isArray(roles) ? roles : [roles])
        .filter(Boolean)
        .map((r) => String(r).toUpperCase());

      const requiredUpper = requiredRoles.map((r) => String(r).toUpperCase());

      const has = rolesArr.some((r) => requiredUpper.includes(r));
    };
  });
});
