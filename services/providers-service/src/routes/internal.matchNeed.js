// services/providers-service/src/routes/internal.matchNeed.js

import { prisma } from "../lib/prisma.js";

export default async function internalMatchNeedRoutes(fastify, opts) {
  fastify.post("/match-need", async (request, reply) => {
    try {
      const body = request.body || {};
      const need = body.need || {};
      const context = body.context || {};

      const { subcategoryId, tagId, priority } = need;
      const { city } = context;

      const whereOffer = {
        isPublic: true,
        status: "ACTIVE",
      };

      if (subcategoryId) {
        whereOffer.subcategoryId = subcategoryId;
      }

      if (tagId) {
        whereOffer.tags = {
          some: {
            tagId: tagId,
          },
        };
      }

      // căutăm oferte de servicii potrivite
      const offers = await prisma.serviceOffer.findMany({
        where: whereOffer,
        include: {
          providerProfile: true,
        },
      });

      const providersMap = new Map();

      for (const offer of offers) {
        const profile = offer.providerProfile;
        if (!profile) continue;

        const key = profile.id;
        const normalizedCity = (profile.city || "").trim().toLowerCase();
        const ctxCity = (city || "").trim().toLowerCase();

        let score = 1;

        if (normalizedCity && ctxCity && normalizedCity === ctxCity) {
          score += 0.5;
        }

        if ((priority || "").toUpperCase() === "HIGH") {
          score += 0.2;
        }

        const existing = providersMap.get(key);
        if (!existing || score > existing.score) {
          providersMap.set(key, {
            id: profile.id,
            userId: profile.userId,
            name:
              profile.displayName ||
              profile.businessName ||
              profile.publicName ||
              "Provider",
            city: profile.city || null,
            score,
          });
        }
      }

      const providers = Array.from(providersMap.values()).sort(
        (a, b) => b.score - a.score
      );

      return reply.send({ providers });
    } catch (err) {
      request.log.error({ err }, "internal match-need failed");
      return reply.code(500).send({ error: "match-need internal error" });
    }
  });
}
