import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';
import { emitDomainEvent } from '../lib/events.js';

export default fp(async function meAvailabilityRoutes (fastify, opts) {
  const requireProvider = fastify.requireRole('PROVIDER');

  async function getProfileOrThrow (userId) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId }
    });
    if (!profile) {
      throw fastify.httpErrors.badRequest('Provider profile not found');
    }
    return profile;
  }

  // List availability blocks (raw)
  fastify.get('/v1/providers/me/availability', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    const userId = request.user.id;
    const profile = await getProfileOrThrow(userId);

    const items = await prisma.providerAvailability.findMany({
      where: { providerProfileId: profile.id },
      orderBy: { dateFrom: 'asc' }
    });

    return items;
  });

  // Replace availability with new set of blocks
  fastify.put('/v1/providers/me/availability', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    const userId = request.user.id;
    const profile = await getProfileOrThrow(userId);
    const { blocks } = request.body || {};

    // blocks: [{ dateFrom, dateTo, status, note }]
    if (!Array.isArray(blocks)) {
      return reply.code(400).send({ message: 'blocks must be array' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.providerAvailability.deleteMany({
        where: { providerProfileId: profile.id }
      });

      if (blocks.length > 0) {
        await tx.providerAvailability.createMany({
          data: blocks.map((b) => ({
            providerProfileId: profile.id,
            dateFrom: new Date(b.dateFrom),
            dateTo: new Date(b.dateTo),
            status: b.status,
            note: b.note || null
          }))
        });
      }
    });

    await emitDomainEvent('availability.changed', {
      providerProfileId: profile.id
    });

    const items = await prisma.providerAvailability.findMany({
      where: { providerProfileId: profile.id },
      orderBy: { dateFrom: 'asc' }
    });

    return items;
  });

  // Calendar view (agregat simplu pe zile)
  fastify.get('/v1/providers/me/calendar', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    const userId = request.user.id;
    const profile = await getProfileOrThrow(userId);
    const { from, to } = request.query;

    const dateFrom = from ? new Date(from) : new Date();
    const dateTo = to ? new Date(to) : new Date(dateFrom.getTime() + 30 * 86400000);

    const blocks = await prisma.providerAvailability.findMany({
      where: {
        providerProfileId: profile.id,
        dateFrom: { lte: dateTo },
        dateTo: { gte: dateFrom }
      },
      orderBy: { dateFrom: 'asc' }
    });

    // Deocamdată întoarcem direct blocks; UI poate colora în funcție de status
    return {
      range: { from: dateFrom, to: dateTo },
      blocks
    };
  });

  fastify.put('/v1/providers/me/calendar/blocks', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    // alias pentru /availability – eventual în viitor facem diferența între BLOCKED și BOOKED
    const res = await fastify.inject({
      method: 'PUT',
      url: '/v1/providers/me/availability',
      headers: request.headers,
      payload: request.body
    });
    reply.code(res.statusCode);
    return res.json();
  });
});
