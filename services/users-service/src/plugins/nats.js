// src/plugins/nats.js
const fp = require('fastify-plugin');
const { connect } = require('nats');
const logger = require('../lib/logger');

function mockNats() {
  // sub gol care se închide imediat
  const emptySub = {
    [Symbol.asyncIterator]: async function* () { /* no messages */ }
  };
  return {
    publish: async () => {},
    subscribe: () => emptySub,
    drain: async () => {}
  };
}

async function natsPlugin(fastify) {
  const shouldMock = process.env.NODE_ENV === 'test' || process.env.NATS_DISABLED === '1';

  if (shouldMock) {
    fastify.decorate('nats', mockNats());
    logger.info('NATS mocked for tests');
    return;
  }

  const url = process.env.NATS_URL || 'nats://localhost:4222';
  const client = await connect({ servers: url, name: process.env.NATS_CLIENT_ID || 'users-svc' });
  logger.info({ url }, 'NATS connected');
  fastify.decorate('nats', client);

  fastify.addHook('onClose', async () => {
    await client.drain();
  });
}

module.exports = fp(natsPlugin);
