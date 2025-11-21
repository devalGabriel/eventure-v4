import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';

export default fp(async function catalogRoutes (fastify, opts) {
  fastify.get('/v1/providers/catalog/categories', async (request, reply) => {
    const cats = await prisma.providerCategory.findMany({
  where: { isActive: true },
  orderBy: { sortOrder: 'asc' },
  include: {
    subcategories: {
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        tags: {
          where: { isActive: true }
        }
      }
    }
  }
});

    return cats;
  });
});
