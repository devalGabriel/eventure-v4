const fp = require('fastify-plugin');
const { PrismaClient } = require('@prisma/client');

async function prismaPlugin(fastify) {
  const prisma = new PrismaClient();
  await prisma.$connect();
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
}

module.exports = fp(prismaPlugin);
