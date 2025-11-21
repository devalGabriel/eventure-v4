import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';

export default fp(async function adminProvidersRoutes(fastify, opts) {
  const requireAdmin = fastify.requireRole('ADMIN');

fastify.get('/v1/providers', {
  preHandler: [fastify.authenticate, requireAdmin]
}, async (request, reply) => {
  const {
    status,
    city,
    q,
    page = 1,
    pageSize = 50,
    watchlistOnly,          // <— NOU
  } = request.query || {};

  const take = Number(pageSize) || 50;
  const skip = (Number(page) - 1) * take;

  const normStatus =
    status && status !== 'undefined' && status !== 'null' && status !== ''
      ? status
      : undefined;

  const normCity =
    city && city !== 'undefined' && city !== 'null' && city !== ''
      ? city
      : undefined;

  const normQ =
    q && q !== 'undefined' && q !== 'null' && q !== ''
      ? q
      : undefined;

  const where = {
    ...(normStatus ? { status: normStatus } : {}),
    ...(normCity
      ? { city: { contains: normCity, mode: 'insensitive' } }
      : {}),
    ...(normQ
      ? {
          OR: [
            { displayName: { contains: normQ, mode: 'insensitive' } },
            { legalName: { contains: normQ, mode: 'insensitive' } },
            { city: { contains: normQ, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  // 🔸 filtrare după watchlistOnly
  if (watchlistOnly === 'true') {
    where.isWatchlisted = true;
  }

  const [items, total] = await Promise.all([
    prisma.providerProfile.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        legalName: true,
        city: true,
        status: true,
        createdAt: true,
        isWatchlisted: true,  // <— să vină flag-ul în UI
        _count: {
          select: {
            offers: true,
            packages: true,
          },
        },
      },
    }),
    prisma.providerProfile.count({ where }),
  ]);

  return {
    items,
    total,
    page: Number(page),
    pageSize: take,
  };
});



  fastify.get('/v1/providers/:id', {
    preHandler: [fastify.authenticate, requireAdmin]
  }, async (request, reply) => {
    const id = Number(request.params.id);

    const provider = await prisma.providerProfile.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            subcategory: {
              include: { category: true }
            }
          }
        },
        tags: {
          include: {
            tag: {
              include: {
                subcategory: {
                  include: { category: true }
                }
              }
            }
          }
        },
        offers: {
          include: {
            subcategory: {
              include: { category: true }
            },
            tags: { include: { tag: true } },
            group: true
          },
          orderBy: { createdAt: 'desc' }
        },
        packages: {
          include: {
            items: {
              include: {
                serviceOffer: {
                  include: {
                    subcategory: { include: { category: true } },
                    group: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        groups: {
          include: {
            members: true
          }
        },
        availability: true,
        reviews: true
      }
    });

    if (!provider) {
      return reply.code(404).send({ message: 'Provider not found' });
    }

    return provider;
  });



  fastify.patch('/v1/providers/:id', {
    preHandler: [fastify.authenticate, requireAdmin]
  }, async (request, reply) => {
    const id = Number(request.params.id);
    const { status, displayName, legalName, taxId, email, phone,isWatchlisted } = request.body || {};

    const data = {};
    if (status) data.status = status;
    if (displayName !== undefined) data.displayName = displayName;
    if (legalName !== undefined) data.legalName = legalName;
    if (taxId !== undefined) data.taxId = taxId;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
if (typeof isWatchlisted === 'boolean') {
    data.isWatchlisted = isWatchlisted;
  }
    const updated = await prisma.providerProfile.update({
      where: { id },
      data
    });

    return updated;
  });

  fastify.get('/v1/providers/:id/admin-notes', {
    preHandler: [fastify.authenticate, requireAdmin]
  }, async (request, reply) => {
    const id = Number(request.params.id);

    if (Number.isNaN(id)) {
      reply.code(400);
      return { error: 'Invalid provider id' };
    }

      const notes = await prisma.providerAdminNote.findMany({
      where: { providerId: id },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    return notes;
  });

  fastify.post('/v1/providers/:id/admin-notes', {
    preHandler: [fastify.authenticate, requireAdmin]
  }, async (request, reply) => {
    const id = Number(request.params.id);
    if (Number.isNaN(id)) {
      reply.code(400);
      return { error: 'Invalid provider id' };
    }

    const { note } = request.body || {};
    if (!note || !note.trim()) {
      reply.code(400);
      return { error: 'Note text is required' };
    }

    const adminUserId = request.user?.id;
    const adminName = request.user?.name || request.user?.email || null;

    const created = await prisma.providerAdminNote.create({
      data: {
        providerId: id,
        adminUserId,
        adminName,
        note: note.trim()
      }
    });

    reply.code(201);
    return created;
  });

});
