// services/providers-service/src/routes/client.packages.js
import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';

export default fp(async function clientPackagesRoutes(fastify, opts) {
  const requireClient = fastify.requireRole('CLIENT');

  fastify.get(
    '/v1/client/packages',
    {
      preHandler: [fastify.authenticate, requireClient],
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
        eventBudget,
        // 🔹 nou – buget propus specific pentru invitații
        proposedBudget,
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
          OR: [{ name: { contains: term } }, { description: { contains: term } }],
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
              { address: { contains: loc } },
            ],
          },
        });
      }

      // 💸 filtrare buget – folosim DOAR basePrice (existent în ServicePackage)
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
          basePrice: { gte: minB },
        });
      }

      if (maxB !== null && !Number.isNaN(maxB)) {
        and.push({
          basePrice: { lte: maxB },
        });
      }

      // 🧩 categorie / subcategorie – folosește ID-uri numerice dacă le trimiți
      const subcatId =
        subcategoryId !== undefined &&
        subcategoryId !== null &&
        subcategoryId !== ''
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
              some: { subcategoryId: subcatId },
            },
          },
        });
      } else if (catId !== null && !Number.isNaN(catId)) {
        and.push({
          providerProfile: {
            categories: {
              some: {
                subcategory: {
                  categoryId: catId,
                },
              },
            },
          },
        });
      }

      // 📦 doar „grupuri” de servicii – momentan interpretate ca SINGLE_EVENT
      // TODO: legătură directă cu grupurile când modelul e stabil
      if (String(onlyGroups).toLowerCase() === 'true') {
        and.push({
          type: 'SINGLE_EVENT',
        });
      }

      // 🔹 NOUA REGULĂ: proposedBudget + allowBelowBaseBudget
      // - dacă clientul trimite proposedBudget, includem:
      //    * pachete cu basePrice <= proposedBudget
      //    * SAU pachete unde providerul a bifat allowBelowBaseBudget = true
      let proposedBudgetNum = null;
      if (
        proposedBudget !== undefined &&
        proposedBudget !== null &&
        proposedBudget !== ''
      ) {
        const n = Number(proposedBudget);
        if (!Number.isNaN(n) && n > 0) {
          proposedBudgetNum = n;
        }
      }

      if (proposedBudgetNum !== null) {
        and.push({
          OR: [
            { basePrice: { lte: proposedBudgetNum } },
            { allowBelowBaseBudget: true },
          ],
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
                serviceOffer: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ]);

      // 🧠 scoring light pe buget
      // folosim în scor în primul rând proposedBudget (dacă există),
      // altfel eventBudget (cazul de browse clasic).
      let budgetForScore = null;

      if (proposedBudgetNum !== null) {
        budgetForScore = proposedBudgetNum;
      } else if (
        eventBudget !== undefined &&
        eventBudget !== null &&
        eventBudget !== ''
      ) {
        const n = Number(eventBudget);
        if (!Number.isNaN(n) && n > 0) {
          budgetForScore = n;
        }
      }

      let items = rawItems.map((pkg) => {
        let score = 0;

        if (budgetForScore !== null && !Number.isNaN(budgetForScore)) {
          const base = pkg.basePrice ?? null;
          if (base !== null) {
            const diff = Math.abs(Number(base) - budgetForScore);
            if (diff <= budgetForScore * 0.1) score += 2; // ±10%
            else if (diff <= budgetForScore * 0.25) score += 1; // ±25%
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
            score: _score ?? null,
          };
        }),
        total,
        page: Number(page),
        pageSize: take,
      });
    }
  );
});
