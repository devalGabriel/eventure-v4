// services/notifications-service/src/plugins/prisma.js
const fp = require('fastify-plugin');
const { PrismaClient } = require('@prisma/client');

module.exports = fp(async (fastify) => {
  const prisma = new PrismaClient({
  log: process.env.PRISMA_LOG
    ? ['query', 'info', 'warn', 'error']
    : ['error']
});
  await prisma.$connect();
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
