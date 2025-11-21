const fp = require('fastify-plugin');
module.exports = fp(async (fastify) => {
  await fastify.register(require('@fastify/helmet'), {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
  });
});
