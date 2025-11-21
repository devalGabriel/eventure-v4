// services/users-service/src/plugins/static.js
const fp = require('fastify-plugin');
const path = require('path');

module.exports = fp(async (fastify) => {
  // dacă a fost deja setat în altă parte, ieșim
  if (fastify.hasDecorator('uploadsStaticRegistered')) return;

  await fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, '../../uploads'),
    prefix: '/uploads/',
    decorateReply: false,
    setHeaders(res) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*'); // dev only
    }
  });

  fastify.decorate('uploadsStaticRegistered', true);
});
