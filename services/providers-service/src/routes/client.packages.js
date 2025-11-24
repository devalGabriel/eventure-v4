// services/providers-service/src/routes/client.packages.js
import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';

export default fp(async function clientPackagesRoutes(fastify, opts) {
  const requireClient = fastify.requireRole('CLIENT');

  fastify.get(
    '/v1/client/packages',
    {
      preHandler: [fastify.authenticate, requireClient]
    },
    async (request, reply) => {
      const {
        page = 1,
        pageSize = 12,
        q,
        location,
        budgetMin,
        budgetMax,
        categoryId,
        subcategoryId,
        onlyGroups,
        eventGuests,
        eventBudget
      } = request.query || {};

      const take = Math.min(50, Number(pageSize) || 12);
      const skip = (Number(page) - 1) * take;

      const and = [];

      // doar pachete publice, nu interne
      and.push({ isPublic: true });
      and.push({ internalOnly: false });

      // 🔍 căutare simplă după nume + descriere
      if (q && q.trim()) {
        const term = q.trim();
        and.push({
          OR: [
            { name: { contains: term } },
            { description: { contains: term } }
          ]
        });
      }

      // 📍 filtrare după locație (city / country / address) din ProviderProfile
      if (location && location.trim()) {
        const loc = location.trim();
        and.push({
          providerProfile: {
            OR: [
              { city: { contains: loc } },
              { country: { contains: loc } },
              { address: { contains: loc } }
            ]
          }
        });
      }

      // 💸 filtrare buget – folosim DOAR basePrice (ăsta există în ServicePackage)
      const minB =
        budgetMin !== undefined && budgetMin !== null && budgetMin !== ''
          ? Number(budgetMin)
          : null;
      const maxB =
        budgetMax !== undefined && budgetMax !== null && budgetMax !== ''
          ? Number(budgetMax)
          : null;
      
      if (minB !== null && !Number.isNaN(minB)) {
        and.push({
          basePrice: { gte: minB }
        });
      }

      if (maxB !== null && !Number.isNaN(maxB)) {
        and.push({
          basePrice: { lte: maxB }
        });
      }

      // 🧩 categorie / subcategorie – folosește ID-uri numerice dacă le trimiți
      const subcatId =
        subcategoryId !== undefined && subcategoryId !== null && subcategoryId !== ''
          ? Number(subcategoryId)
          : null;
      const catId =
        categoryId !== undefined && categoryId !== null && categoryId !== ''
          ? Number(categoryId)
          : null;

      if (subcatId !== null && !Number.isNaN(subcatId)) {
        and.push({
          providerProfile: {
            categories: {
              some: { subcategoryId: subcatId }
            }
          }
        });
      } else if (catId !== null && !Number.isNaN(catId)) {
        and.push({
          providerProfile: {
            categories: {
              some: {
                subcategory: {
                  categoryId: catId
                }
              }
            }
          }
        });
      }

      // 📦 doar „grupuri” de servicii – momentan interpretate ca SINGLE_EVENT
      // este necesar sa luam din serviceOffer daca este livrat de grup sau este livrat individual
      if (String(onlyGroups).toLowerCase() === 'true') {
        and.push({
          type: 'SINGLE_EVENT'
        });
      }

      const where = and.length ? { AND: and } : {};

      // 🟣 Query DB
      const [total, rawItems] = await Promise.all([
        prisma.servicePackage.count({ where }),
        prisma.servicePackage.findMany({
          where,
          include: {
            providerProfile: true,
            items: {
              include: {
                serviceOffer: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take
        })
      ]);

      // 🧠 scoring light doar pe buget (folosește basePrice, nu minBudget/maxBudget)
      const evBudget =
        eventBudget !== undefined && eventBudget !== null && eventBudget !== ''
          ? Number(eventBudget)
          : null;

      let items = rawItems.map((pkg) => {
        let score = 0;

        if (evBudget !== null && !Number.isNaN(evBudget)) {
          const base = pkg.basePrice ?? null;
          if (base !== null) {
            const diff = Math.abs(Number(base) - evBudget);
            if (diff <= evBudget * 0.1) score += 2; // ±10%
            else if (diff <= evBudget * 0.25) score += 1; // ±25%
          }
        }

        return { ...pkg, _score: score };
      });

      items.sort((a, b) => (b._score || 0) - (a._score || 0));

      return reply.send({
        items: items.map((p) => {
          const { _score, ...rest } = p;
          return {
            ...rest,
            score: _score ?? null
          };
        }),
        total,
        page: Number(page),
        pageSize: take
      });
    }
  );
});
