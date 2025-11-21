import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';
import { emitDomainEvent } from '../lib/events.js';

export default fp(async function meOffersRoutes (fastify, opts) {
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

  // =========================
  // LISTĂ OFERTE (SERVICII)
  // =========================
  fastify.get('/v1/providers/me/offers', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    const userId = request.user.id;
    const profile = await getProfileOrThrow(userId);

    const offers = await prisma.serviceOffer.findMany({
      where: { providerProfileId: profile.id },
      include: {
        subcategory: {
          include: { category: true }
        },
        tags: {
          include: { tag: true }
        },
        group: true      // 🔹 important pentru UI: offer.group?.name
      },
      orderBy: { createdAt: 'desc' }
    });

    return offers;
  });

  // =========================
  // CREARE OFERTĂ
  // =========================
  fastify.post('/v1/providers/me/offers', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    const userId = request.user.id;
    const profile = await getProfileOrThrow(userId);

    const {
      title,
      description,
      basePrice,
      currency,
      pricingUnit,
      isPublic,
      subcategoryId, // clasificare
      tagIds,        // array de tag-uri
      durationMinutes,
      canOverlap,
      maxEventsPerDay,
      maxGuests,
      groupId        // dacă e livrat de un grup
    } = request.body || {};

    const ownershipType = groupId ? 'GROUP' : 'SOLO';

    const created = await prisma.serviceOffer.create({
      data: {
        providerProfileId: profile.id,
        title,
        description,
        basePrice,
        currency,
        pricingUnit,
        isPublic: isPublic ?? true,
        status: 'ACTIVE', // sau DRAFT dacă vrei alt flux
        ownershipType,
        subcategoryId: subcategoryId ? Number(subcategoryId) : null,
        durationMinutes: durationMinutes ?? null,
        canOverlap: canOverlap ?? false,
        maxEventsPerDay: maxEventsPerDay ?? null,
        maxGuests: maxGuests ?? null,
        groupId: groupId ? Number(groupId) : null,
        tags: Array.isArray(tagIds) && tagIds.length
          ? {
              create: tagIds.map((tagId) => ({
                tagId: Number(tagId)
              }))
            }
          : undefined
      },
      include: {
        subcategory: {
          include: { category: true }
        },
        tags: {
          include: { tag: true }
        },
        group: true
      }
    });

    await emitDomainEvent('provider.service_offer.created', {
      providerProfileId: profile.id,
      serviceOfferId: created.id
    });

    return created;
  });

  // =========================
  // UPDATE OFERTĂ
  // =========================
  fastify.put('/v1/providers/me/offers/:id', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    const userId = request.user.id;
    const profile = await getProfileOrThrow(userId);
    const id = Number(request.params.id);

    const existing = await prisma.serviceOffer.findUnique({
      where: { id },
      include: { tags: true, group: true }
    });

    if (!existing || existing.providerProfileId !== profile.id) {
      return reply.code(404).send({ message: 'Service offer not found' });
    }

    const {
      title,
      description,
      basePrice,
      currency,
      pricingUnit,
      isPublic,
      status,
      subcategoryId,
      tagIds,
      durationMinutes,
      canOverlap,
      maxEventsPerDay,
      maxGuests,
      groupId
    } = request.body || {};

    const ownershipType = groupId ? 'GROUP' : 'SOLO';

    const updated = await prisma.$transaction(async (tx) => {
      await tx.serviceOffer.update({
        where: { id },
        data: {
          title,
          description,
          basePrice,
          currency,
          pricingUnit,
          isPublic,
          status,
          subcategoryId: subcategoryId ? Number(subcategoryId) : null,
          durationMinutes: durationMinutes ?? null,
          canOverlap: canOverlap ?? false,
          maxEventsPerDay: maxEventsPerDay ?? null,
          maxGuests: maxGuests ?? null,
          groupId: groupId ? Number(groupId) : null,
          ownershipType
        }
      });

      if (Array.isArray(tagIds)) {
        await tx.serviceOfferTag.deleteMany({
          where: { serviceOfferId: id }
        });

        if (tagIds.length > 0) {
          await tx.serviceOfferTag.createMany({
            data: tagIds.map((tagId) => ({
              serviceOfferId: id,
              tagId: Number(tagId)
            }))
          });
        }
      }

      return tx.serviceOffer.findUnique({
        where: { id },
        include: {
          subcategory: { include: { category: true } },
          tags: { include: { tag: true } },
          group: true
        }
      });
    });

    await emitDomainEvent('provider.service_offer.updated', {
      providerProfileId: profile.id,
      serviceOfferId: updated.id
    });

    return updated;
  });

  // =========================
  // ȘTERGERE OFERTĂ
  // =========================
  fastify.delete('/v1/providers/me/offers/:id', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    const userId = request.user.id;
    const profile = await getProfileOrThrow(userId);
    const id = Number(request.params.id);

    const existing = await prisma.serviceOffer.findUnique({
      where: { id },
      select: {
        id: true,
        providerProfileId: true
      }
    });

    if (!existing || existing.providerProfileId !== profile.id) {
      return reply.code(404).send({ message: 'Service offer not found' });
    }

    await prisma.$transaction(async (tx) => {
      // scoatem întâi legăturile (tag-uri + items din pachete) ca să nu dea FK error
      await tx.serviceOfferTag.deleteMany({
        where: { serviceOfferId: id }
      });

      await tx.servicePackageItem.deleteMany({
        where: { serviceOfferId: id }
      });

      await tx.serviceOffer.delete({
        where: { id }
      });
    });

    await emitDomainEvent('provider.service_offer.deleted', {
      providerProfileId: profile.id,
      serviceOfferId: id
    });

    return { ok: true };
  });
});
