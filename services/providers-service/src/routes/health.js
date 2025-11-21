import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';
import { getNats } from '../lib/nats.js';

export default fp(async function healthRoutes (fastify, opts) {
  fastify.get('/health', async (request, reply) => {
    const db = await prisma.$queryRaw`SELECT 1 as ok`;
    let natsStatus = 'unknown';
    try {
      const nc = await getNats();
      natsStatus = nc ? 'ok' : 'down';
    } catch {
      natsStatus = 'down';
    }

    return {
      service: 'providers-service',
      status: 'ok',
      db: 'ok',
      nats: natsStatus,
      time: new Date().toISOString()
    };
  });
});
