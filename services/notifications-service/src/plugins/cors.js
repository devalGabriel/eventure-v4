const fp = require('fastify-plugin');
module.exports = fp(async (fastify) => {
  await fastify.register(require('@fastify/cors'), {
    origin: true,
    credentials: true,
    methods: ['GET','POST','OPTIONS']
  });
});
