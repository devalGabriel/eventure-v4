const fastifyFactory = require('fastify');
const logger = require('./lib/logger');

function build() {
    const fastify = fastifyFactory({ logger });
  const SAFE_BOOT = process.env.SAFE_BOOT === '1';

  // plugins
  fastify.register(require('./plugins/sensible'));
  fastify.register(require('./plugins/cors'));     // setat să accepte UI_ORIGIN în plugin
  fastify.register(require('./plugins/helmet'));
  if (!SAFE_BOOT) {
    fastify.register(require('./plugins/swagger'));
    fastify.register(require('./plugins/prisma'));
    fastify.register(require('./plugins/nats'));
    fastify.register(require('./plugins/outbox-publisher'));
    fastify.register(require('./plugins/upload'));
    fastify.register(require('./plugins/static'));
    fastify.register(require('./plugins/authenticate'));
  }

  // routes
  fastify.register(require('./routes/health'));
  if (!SAFE_BOOT) {
    fastify.register(require('./routes/users'));
    fastify.register(require('./routes/roles'));
    fastify.register(require('./routes/me'));
  }


  // consumers
  if (!SAFE_BOOT) {
    fastify.after(async (err) => {
      if (err) throw err;
      const { registerAuthConsumer } = require('./consumers/authUserRegistered');
      const { registerProviderDecidedConsumer } = require('./consumers/providerDecided');

      await registerAuthConsumer(fastify);
      await registerProviderDecidedConsumer(fastify);
    });
  }

  return fastify;
}

module.exports = build;
