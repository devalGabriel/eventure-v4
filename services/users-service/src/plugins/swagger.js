const fp = require('fastify-plugin');

async function swaggerPlugin(fastify) {
  await fastify.register(require('@fastify/swagger'), {
    openapi: {
      info: { title: 'Users Service', version: '1.0.0' }
    }
  });
  await fastify.register(require('@fastify/swagger-ui'), { routePrefix: '/docs' });
}
module.exports = fp(swaggerPlugin);
