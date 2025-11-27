// services/providers-service/src/routes/me.groups.js
import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';

export default fp(async function meGroupsRoutes(fastify, opts) {
  const requireProvider = fastify.requireRole('PROVIDER');

  async function getProfileOrThrow(userId) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      const err = new Error('Provider profile not found');
      err.statusCode = 404;
      throw err;
    }
    return profile;
  }

  // GET /v1/providers/me/groups
  // Listă grupuri create de mine + grupuri în care sunt membru
  // + servicii și pachete asociate grupurilor (prin groupId)
  fastify.get('/v1/providers/me/groups',
    {
      preHandler: [fastify.authenticate, requireProvider],
    },
    async (request, reply) => {
      const userId = request.user.id;
      const profile = await getProfileOrThrow(userId);

      // 1) Grupuri create de mine (owner)
      // 1) Grupuri create de mine (owner)
      const ownerGroups = await prisma.providerGroup.findMany({
        where: { providerProfileId: profile.id },
        include: {
          members: {
            include: {
              providerProfile: {
                select: {
                  id: true,
                  userId: true,
                  displayName: true,
                  email: true,
                  city: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });


      // 2) Grupuri în care sunt membru (pe baza providerProfileId, NU userId)
      // 2) Grupuri în care sunt membru (pe baza providerProfileId)
      const myMemberships = await prisma.providerGroupMember.findMany({
        where: {
          providerProfileId: profile.id,
          isActive: true,
        },
        include: {
          // profilul meu de provider (membrul curent)
          providerProfile: {
            select: {
              id: true,
              userId: true,
              displayName: true,
              email: true,
              city: true,
            },
          },
          // grupul + toți membrii lui, cu profilurile lor
          group: {
            include: {
              members: {
                include: {
                  providerProfile: {
                    select: {
                      id: true,
                      userId: true,
                      displayName: true,
                      email: true,
                      city: true,
                    },
                  },
                },
              },
              _count: {
                select: { members: true },
              },
            },
          },
        },
      });


      // agregăm membership-urile pe grup ca să nu duplicăm
      const memberGroupsMap = new Map();
      for (const m of myMemberships) {
        if (!m.group) continue;
        const g = m.group;

        const membershipMeta = {
          membershipId: m.id,
          role: m.role,
          shareMode: m.shareMode,
          shareValue: m.shareValue,
          specializationTag: m.specializationTag,
        };

        if (!memberGroupsMap.has(g.id)) {
          memberGroupsMap.set(g.id, {
            ...g,
            myMemberships: [membershipMeta],
          });
        } else {
          memberGroupsMap.get(g.id).myMemberships.push(membershipMeta);
        }
      }

      const memberGroups = Array.from(memberGroupsMap.values());

      // 3) Toate groupId-urile la care am legătură (owner sau membru)
      const allGroupIds = new Set();
      ownerGroups.forEach((g) => allGroupIds.add(g.id));
      myMemberships.forEach((m) => {
        if (m.groupId) allGroupIds.add(m.groupId);
      });

      let groupedOffers = [];
      let groupPackages = [];

      if (allGroupIds.size > 0) {
        const groupIdArray = Array.from(allGroupIds);

        // servicii marcate ca „livrate de” aceste grupuri
        groupedOffers = await prisma.serviceOffer.findMany({
          where: {
            groupId: { in: groupIdArray },
          },
          include: {
            group: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        // pachete care includ servicii livrate de aceste grupuri
        groupPackages = await prisma.servicePackage.findMany({
          where: {
            items: {
              some: {
                serviceOffer: {
                  groupId: { in: groupIdArray },
                },
              },
            },
          },
          include: {
            items: {
              include: {
                serviceOffer: true,
              },
            },
          },
        });
      }

      return {
        groups: ownerGroups,  // grupuri create de mine
        groupedOffers,        // servicii „livrate de grup”
        memberGroups,         // grupuri în care sunt membru
        groupPackages,        // pachete care includ servicii ale grupurilor
      };
    }
  );

  // POST /v1/providers/me/groups – grup nou (owner = provider-ul curent)
    // POST /v1/providers/me/groups – grup nou (owner = provider-ul curent)
  fastify.post(
    '/v1/providers/me/groups',
    {
      preHandler: [fastify.authenticate, requireProvider],
    },
    async (request, reply) => {
      const userId = request.user.id;
      const profile = await getProfileOrThrow(userId);

      const {
        name,
        description,
        isActive = true,
        members = [],
        sharePolicy = 'MANUAL',
      } = request.body || {};

      if (!name || !name.trim()) {
        return reply.code(400).send({ message: 'Name is required' });
      }

      // validare minimală pe membri (dacă vin)
      if (Array.isArray(members)) {
        for (const m of members) {
          if (!m.providerProfileId || !m.serviceOfferId) {
            return reply.code(400).send({
              message:
                'Each member must have providerProfileId and serviceOfferId',
            });
          }
        }
      }

      const created = await prisma.providerGroup.create({
        data: {
          providerProfileId: profile.id,
          name: name.trim(),
          description: description || null,
          isActive,
          sharePolicy,
          members:
            Array.isArray(members) && members.length
              ? {
                  create: members.map((m) => ({
                    providerProfileId: Number(m.providerProfileId),
                    serviceOfferId: Number(m.serviceOfferId),
                    role: m.role || 'MEMBER',
                    specializationTag: m.specializationTag || null,
                    isActive: m.isActive ?? true,
                    shareMode: m.shareMode || 'NONE',
                    shareValue:
                      m.shareValue != null ? Number(m.shareValue) : null,
                  })),
                }
              : undefined,
        },
        include: {
          members: {
            include: {
              providerProfile: {
                select: {
                  id: true,
                  userId: true,
                  displayName: true,
                  email: true,
                  city: true,
                },
              },
              serviceOffer: true,
            },
          },
        },
      });

      await fastify.emitDomainEvent?.('provider.group.created', {
        providerProfileId: profile.id,
        groupId: created.id,
      });

      return created;
    }
  );


  // PUT /v1/providers/me/groups/:id – update + înlocuire totală membri
  fastify.put('/v1/providers/me/groups/:id',
    {
      preHandler: [fastify.authenticate, requireProvider],
    },
    async (request, reply) => {
      const userId = request.user.id;
      const profile = await getProfileOrThrow(userId);
      const id = Number(request.params.id);

      const existing = await prisma.providerGroup.findUnique({
        where: { id },
        include: { members: true },
      });

      if (!existing || existing.providerProfileId !== profile.id) {
        return reply.code(404).send({ message: 'Group not found' });
      }

      const { name, description, isActive, members, sharePolicy } =
        request.body || {};

        const updated = await prisma.$transaction(async (tx) => {
        await tx.providerGroup.update({
          where: { id },
          data: {
            name,
            description,
            isActive,
            sharePolicy,
          },
        });

        if (Array.isArray(members)) {
          await tx.providerGroupMember.deleteMany({
            where: { groupId: id },
          });

          if (members.length > 0) {
            await tx.providerGroupMember.createMany({
              data: members.map((m) => ({
                groupId: id,
                providerProfileId: m.providerProfileId,
                role: m.role || null,
                serviceOfferId: m.serviceOfferId,
                specializationTag: m.specializationTag,
                isActive: m.isActive ?? true,
                shareMode: m.shareMode || 'NONE',
                shareValue:
                  m.shareValue != null ? Number(m.shareValue) : null,
              })),
            });
          }
        }

        return tx.providerGroup.findUnique({
          where: { id },
          include: { members: true },
        });
      });

      await fastify.emitDomainEvent?.('provider.group.updated', {
        providerProfileId: profile.id,
        groupId: updated.id,
      });

      return updated;
    }
  );

  // SEARCH membri potențiali pentru grup (pe profil, nu pe serviciu)
  // GET /v1/providers/me/group-members/search
  fastify.get('/v1/providers/me/group-members/search',
    {
      preHandler: [fastify.authenticate, requireProvider],
    },
    async (request, reply) => {
      const userId = request.user.id;
      await getProfileOrThrow(userId);

      const { q, city, tagId, from, to } = request.query || {};

      const whereProfile = {
        status: 'ACTIVE',
        ...(q
          ? {
            OR: [
              {
                displayName: {
                  contains: q,
                },
              },
              {
                email: {
                  contains: q,
                },
              },
            ],
          }
          : {}),
        ...(city
          ? {
            city: {
              contains: city,
            },
          }
          : {}),
      };

      const where = {
        ...whereProfile,
        ...(tagId
          ? {
            tags: {
              some: {
                tagId: Number(tagId),
              },
            },
          }
          : {}),
      };

      const include = {
        tags: {
          include: { tag: true },
        },
      };

      if (from && to) {
        include.availability = {
          where: {
            OR: [
              {
                dateFrom: { lte: new Date(to) },
                dateTo: { gte: new Date(from) },
              },
            ],
          },
        };
      }

      const profiles = await prisma.providerProfile.findMany({
        where,
        include,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });

      const items = profiles.map((p) => ({
        userId: p.userId,
        providerProfileId: p.id,
        displayName: p.displayName,
        email: p.email,
        city: p.city,
        tags: (p.tags || []).map((pt) => ({
          id: pt.tagId,
          label: pt.tag.label,
        })),
      }));

      return { items };
    }
  );

  // Servicii ale unui provider (pentru asociere în grup) – rămâne neschimbat
  fastify.get('/v1/providers/me/group-members/services',
    {
      preHandler: [fastify.authenticate, requireProvider],
    },
    async (request, reply) => {
      const userId = request.user.id;
      await getProfileOrThrow(userId);

      const { providerProfileId } = request.query || {};
      if (!providerProfileId) {
        return reply
          .code(400)
          .send({ message: 'providerProfileId is required' });
      }

      const offers = await prisma.serviceOffer.findMany({
        where: {
          providerProfileId: Number(providerProfileId),
          status: 'ACTIVE',
        },
        include: {
          subcategory: {
            include: { category: true },
          },
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return offers;
    }
  );

    // 🔹 NOU – membrul își poate părăsi singur grupul
  // POST /v1/providers/me/group-memberships/:id/leave
  fastify.post('/v1/providers/me/group-memberships/:id/leave',
    {
      preHandler: [fastify.authenticate, requireProvider],
    },
    async (request, reply) => {
      const userId = request.user.id;
      const profile = await getProfileOrThrow(userId);
      const membershipId = Number(request.params.id);

      if (!membershipId || Number.isNaN(membershipId)) {
        return reply.code(400).send({ message: 'Invalid membership id' });
      }

      const membership = await prisma.providerGroupMember.findUnique({
        where: { id: membershipId },
        include: {
          group: true,
        },
      });

      if (!membership || membership.providerProfileId !== profile.id) {
        return reply.code(404).send({ message: 'Membership not found' });
      }

      // dacă e și owner-ul grupului, nu îl lăsăm să "plece" așa simplu
      if (membership.group && membership.group.providerProfileId === profile.id) {
        return reply.code(400).send({
          message:
            'Owner-ul grupului nu poate părăsi grupul. Transferă ownership sau arhivează grupul.',
        });
      }

      const updated = await prisma.providerGroupMember.update({
        where: { id: membershipId },
        data: {
          isActive: false,
        },
      });

      await fastify.emitDomainEvent?.('provider.group.member.left', {
        providerProfileId: profile.id,
        groupId: membership.groupId,
        membershipId: updated.id,
      });

      return { ok: true };
    }
  );

});
