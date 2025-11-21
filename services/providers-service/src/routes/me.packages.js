// services/providers-service/src/routes/me.packages.js
import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';
import { emitDomainEvent } from '../lib/events.js';

export default fp(async function mePackagesRoutes(fastify, opts) {
  const requireProvider = fastify.requireRole('PROVIDER');

  async function getProfileOrThrow(userId) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId }
    });
    if (!profile) {
      throw fastify.httpErrors.badRequest('Provider profile not found');
    }
    return profile;
  }

  function computeCosts(offers) {
    if (!Array.isArray(offers) || !offers.length) {
      return { totalCost: 0, totalListPrice: 0, currencies: [] };
    }

    let totalCost = 0;
    let totalListPrice = 0;
    const currencies = new Set();

    for (const s of offers) {
      const currency = s.currency || 'RON';
      currencies.add(currency);

      const basePrice = s.basePrice ? Number(s.basePrice) : 0;
      totalListPrice += basePrice;

      const fixedCost = s.baseFixedCost ? Number(s.baseFixedCost) : 0;
      let hourlyCost = 0;
      if (s.baseCostPerHour && s.durationMinutes) {
        hourlyCost =
          Number(s.baseCostPerHour) * (Number(s.durationMinutes) / 60);
      }
      totalCost += fixedCost + hourlyCost;
    }

    return {
      totalCost,
      totalListPrice,
      currencies: Array.from(currencies)
    };
  }

  // LISTĂ PACHETE
  fastify.get('/v1/providers/me/packages', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    const userId = request.user.id;
    const profile = await getProfileOrThrow(userId);

    const packages = await prisma.servicePackage.findMany({
      where: { providerProfileId: profile.id },
      include: {
        items: {
          include: {
            serviceOffer: true
          }
        }
      }
    });
    return packages;
  });

  // CREARE PACHET
  fastify.post('/v1/providers/me/packages', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    const userId = request.user.id;
    const profile = await getProfileOrThrow(userId);
    const {
      name,
      description,
      basePrice,
      currency,
      isPublic,
      internalOnly,
      type,       // SINGLE_EVENT, MULTI_DAY, SUBSCRIPTION
      offerIds
    } = request.body || {};

    const numericBasePrice =
      basePrice != null && basePrice !== ''
        ? Number(basePrice)
        : null;

    let offers = [];
    if (Array.isArray(offerIds) && offerIds.length) {
      offers = await prisma.serviceOffer.findMany({
        where: { id: { in: offerIds.map((id) => Number(id)) } },
        select: {
          id: true,
          basePrice: true,
          currency: true,
          baseFixedCost: true,
          baseCostPerHour: true,
          durationMinutes: true
        }
      });
    }

    const { totalCost, currencies } = computeCosts(offers);

    // 🔒 validare anti-pierdere – doar dacă avem costuri și monedă consistentă
    if (
      numericBasePrice != null &&
      totalCost > 0 &&
      currency &&
      currencies.length === 1 &&
      currencies[0] === currency &&
      numericBasePrice < totalCost
    ) {
      return reply.code(400).send({
        message: `Prețul pachetului (${numericBasePrice.toFixed(
          2
        )} ${currency}) este sub costul minim estimat al serviciilor incluse (${totalCost.toFixed(
          2
        )} ${currency}). Te rog ajustează prețul sau costurile serviciilor.`
      });
    }

    const created = await prisma.servicePackage.create({
      data: {
        providerProfileId: profile.id,
        name,
        description,
        basePrice: numericBasePrice,
        currency,
        isPublic: isPublic ?? true,
        internalOnly: internalOnly ?? false,
        type: type || 'SINGLE_EVENT',
        items: offerIds && Array.isArray(offerIds) && offerIds.length
          ? {
              create: offerIds.map((offerId) => ({
                serviceOfferId: Number(offerId),
                quantity: 1
              }))
            }
          : undefined
      },
      include: {
        items: {
          include: { serviceOffer: true }
        }
      }
    });

    await emitDomainEvent('package.created', {
      providerProfileId: profile.id,
      packageId: created.id,
      offerIds: offerIds || []
    });

    return created;
  });

  // UPDATE PACHET
  fastify.put('/v1/providers/me/packages/:id', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    const userId = request.user.id;
    const profile = await getProfileOrThrow(userId);
    const id = Number(request.params.id);
    const {
      name,
      description,
      basePrice,
      currency,
      isPublic,
      internalOnly,
      type,
      offerIds    // array de ID-uri ServiceOffer
    } = request.body || {};

    const existing = await prisma.servicePackage.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!existing || existing.providerProfileId !== profile.id) {
      return reply.code(404).send({ message: 'Package not found' });
    }

    const numericBasePrice =
      basePrice != null && basePrice !== ''
        ? Number(basePrice)
        : null;

    const finalOfferIds = Array.isArray(offerIds) && offerIds.length
      ? offerIds
      : existing.items.map((it) => it.serviceOfferId);

    let offers = [];
    if (finalOfferIds.length) {
      offers = await prisma.serviceOffer.findMany({
        where: { id: { in: finalOfferIds.map((id) => Number(id)) } },
        select: {
          id: true,
          basePrice: true,
          currency: true,
          baseFixedCost: true,
          baseCostPerHour: true,
          durationMinutes: true
        }
      });
    }

    const { totalCost, currencies } = computeCosts(offers);

    if (
      numericBasePrice != null &&
      totalCost > 0 &&
      currency &&
      currencies.length === 1 &&
      currencies[0] === currency &&
      numericBasePrice < totalCost
    ) {
      return reply.code(400).send({
        message: `Prețul pachetului (${numericBasePrice.toFixed(
          2
        )} ${currency}) este sub costul minim estimat al serviciilor incluse (${totalCost.toFixed(
          2
        )} ${currency}). Te rog ajustează prețul sau costurile serviciilor.`
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const pkg = await tx.servicePackage.update({
        where: { id },
        data: {
          name,
          description,
          basePrice: numericBasePrice,
          currency,
          isPublic,
          internalOnly,
          type
        }
      });

      if (Array.isArray(offerIds)) {
        await tx.servicePackageItem.deleteMany({
          where: { packageId: id }
        });

        if (offerIds.length > 0) {
          await tx.servicePackageItem.createMany({
            data: offerIds.map((offerId) => ({
              packageId: id,
              serviceOfferId: Number(offerId),
              quantity: 1
            }))
          });
        }
      }

      return tx.servicePackage.findUnique({
        where: { id },
        include: {
          items: {
            include: { serviceOffer: true }
          }
        }
      });
    });

    return updated;
  });

  // DELETE PACHET
  fastify.delete('/v1/providers/me/packages/:id', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    const userId = request.user.id;
    const profile = await getProfileOrThrow(userId);
    const id = Number(request.params.id);

    const existing = await prisma.servicePackage.findUnique({
      where: { id },
      select: {
        id: true,
        providerProfileId: true
      }
    });

    if (!existing || existing.providerProfileId !== profile.id) {
      return reply.code(404).send({ message: 'Package not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.servicePackageItem.deleteMany({
        where: { packageId: id }
      });

      await tx.servicePackage.delete({
        where: { id }
      });
    });

    await emitDomainEvent('package.deleted', {
      providerProfileId: profile.id,
      packageId: id
    });

    return { ok: true };
  });
});
