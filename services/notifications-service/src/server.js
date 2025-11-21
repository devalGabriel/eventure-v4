const fastifyFactory = require('fastify');
const fp = require('fastify-plugin');

module.exports = function build() {
  const fastify = fastifyFactory({ logger: true });
  const SAFE_BOOT = process.env.SAFE_BOOT === '1';
  // core
  fastify.register(require('@fastify/sensible'));
  fastify.register(require('@fastify/cors'), { origin: [process.env.UI_ORIGIN || 'http://localhost:3000'], credentials: true });
  fastify.register(require('@fastify/helmet'), { crossOriginResourcePolicy: { policy: 'cross-origin' } });
  if (!SAFE_BOOT) {
    fastify.register(require('@fastify/swagger'), { openapi: { info: { title: 'Notifications', version: '1.0.0' } } });
    fastify.register(require('@fastify/swagger-ui'), { routePrefix: '/docs' });
  }
  // prisma
  if (!SAFE_BOOT) fastify.register(require('./plugins/prisma'));

  // nats (poți reutiliza wrapperul vostru existent)
  if (!SAFE_BOOT) fastify.register(require('./plugins/nats'));

  // routes
  fastify.register(require('./routes/health'));
  if (!SAFE_BOOT) {
    fastify.register(require('./routes/notifications'));  // list/read
    fastify.register(require('./routes/internal'));       // test publish
  }

  // consumers
  if (!SAFE_BOOT) {
    fastify.after(async (err) => {
      if (err) throw err;
      const { registerConsumers } = require('./subscribers/consumers');
      await registerConsumers(fastify);
    });
  }

  return fastify;
};
