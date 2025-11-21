import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';
import { emitDomainEvent } from '../lib/events.js';

export default fp(async function meProfileRoutes (fastify, opts) {
  const requireProvider = fastify.requireRole('PROVIDER');

  async function getOrCreateProfile (userId) {
    let profile = await prisma.providerProfile.findUnique({
      where: { userId }
    });
    if (!profile) {
      profile = await prisma.providerProfile.create({
        data: {
          userId,
          displayName: '',
          status: 'INCOMPLETE'
        }
      });
    }
    return profile;
  }

  fastify.get('/v1/providers/me/profile', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    const userId = request.user.id;
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        categories: { include: { subcategory: true } },
        tags: { include: { tag: true } }
      }
    }) || await getOrCreateProfile(userId);

    return profile;
  });

  fastify.put('/v1/providers/me/profile', {
    preHandler: [fastify.authenticate, requireProvider]
  }, async (request, reply) => {
    const userId = request.user.id;
    const body = request.body || {};

    const {
      displayName,
      legalName,
      taxId,
      email,
      phone,
      website,
      country,
      city,
      address,
      description,
      subcategoryIds, // array<number>
      tagIds         // array<number>
    } = body;

    const profile = await getOrCreateProfile(userId);

    const updated = await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        displayName,
        legalName,
        taxId,
        email,
        phone,
        website,
        country,
        city,
        address,
        description,
        // dacă profilul e completat prima dată => îl punem PENDING_REVIEW
        status: profile.status === 'INCOMPLETE'
          ? 'PENDING_REVIEW'
          : profile.status,
        categories: subcategoryIds
          ? {
              deleteMany: {},
              createMany: {
                data: subcategoryIds.map((sid) => ({
                  subcategoryId: Number(sid)
                }))
              }
            }
          : undefined,
        tags: tagIds
          ? {
              deleteMany: {},
              createMany: {
                data: tagIds.map((tid) => ({
                  tagId: Number(tid)
                }))
              }
            }
          : undefined
      },
      include: {
        categories: { include: { subcategory: true } },
        tags: { include: { tag: true } }
      }
    });

    await emitDomainEvent('profile.updated', {
      providerProfileId: updated.id,
      userId,
      status: updated.status
    });

    return updated;
  });
});
