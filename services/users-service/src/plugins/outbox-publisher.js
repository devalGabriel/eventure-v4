const fp = require('fastify-plugin');
const { publishPending } = require('../lib/outbox');
const logger = require('../lib/logger');

async function outboxPublisher(fastify) {
  const intervalMs = 2000;

  const timer = setInterval(async () => {
    try {
      await publishPending(fastify, 100);
    } catch (e) {
      logger.error(e, 'Outbox tick error');
    }
  }, intervalMs);

  fastify.addHook('onClose', async () => {
    clearInterval(timer);
  });
}

module.exports = fp(outboxPublisher);
