const fp = require('fastify-plugin');
const { connect } = require('nats');

module.exports = fp(async (fastify) => {
  const url = process.env.NATS_URL || 'nats://localhost:4222';
  const name = process.env.NATS_CLIENT_ID || 'notifications-svc';

  try {
    const nc = await connect({ servers: url, name });
    fastify.log.info({ url }, 'NATS connected');
    fastify.decorate('nats', nc);

    fastify.addHook('onClose', async () => {
      try { await nc?.drain(); } catch {}
    });
  } catch (err) {
    fastify.log.warn({ err: err?.message }, 'NATS not connected (non-blocking)');
  }
});
