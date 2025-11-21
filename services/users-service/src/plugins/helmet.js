const fp = require('fastify-plugin');

module.exports = fp(async (fastify) => {
  await fastify.register(require('@fastify/helmet'), {
    // permite servirea asset-urilor (imagini) către alte origini
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // opțional, ca să nu blocheze ferestre popup în dev
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  });
});
