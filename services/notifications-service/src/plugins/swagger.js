const fp = require('fastify-plugin');
module.exports = fp(async (fastify) => {
  await fastify.register(require('@fastify/swagger'), {
    openapi: { info: { title: 'Notifications API', version: '1.0.0' } }
  });
});
