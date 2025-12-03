import { prisma } from '../lib/prisma.js';
import { scoreProviderForNeed } from "../lib/providerScore.js";

/**
 * Provide match-scored providers for a need.
 * Used by events-service AI & UI.
 */
export default async function providersMatchRoutes(app, opts) {
  app.post("/internal/providers/match-need", async (req, res) => {
    const { need, eventBrief } = req.body;

    if (!need?.categoryId)
      return res.status(400).send({ error: "Missing need.categoryId" });

    // 1. Get all providers that offer this category
    const services = await prisma.providerService.findMany({
      where: { categoryId: need.categoryId },
      include: {
        provider: true,
      },
    });

    const providers = services.map((s) => ({
      id: s.providerId,
      name: s.provider.name,
      city: s.provider.city,
      basePrice: s.basePrice,
      eventsCompleted: s.provider.eventsCompleted || 0,
      services: [
        {
          categoryId: s.categoryId,
          subcategoryId: s.subcategoryId,
          tagIds: s.tagIds ?? [],
        },
      ],
    }));

    // 2. Score them
    const scored = [];
    for (const p of providers) {
      const score = await scoreProviderForNeed(p, need, eventBrief);
      scored.push({ ...p, score });
    }

    scored.sort((a, b) => b.score - a.score);

    return res.send(scored);
  });
}
