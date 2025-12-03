import { prisma } from '../lib/prisma.js';
import { scoreProviderForNeed } from "../lib/providerScore.js";

async function providersRoutes(app, opts) {
  /**
   * 1. Obține toți providerii care oferă o categorie/subcategorie
   */
  app.get("/internal/providers/by-category", async (req, res) => {
    const categoryId = Number(req.query.categoryId);

    const services = await prisma.providerService.findMany({
      where: {
        categoryId,
      },
      include: {
        provider: true,
      },
    });

    const providers = services.map((s) => ({
      id: s.providerId,
      name: s.provider.name,
      city: s.provider.city,
      isAvailable: true, // placeholder — completăm în Mesaj 3
      basePrice: s.basePrice,
      services: [
        {
          categoryId: s.categoryId,
          subcategoryId: s.subcategoryId,
          tagIds: s.tagIds || [],
        },
      ],
    }));

    return res.send(providers);
  });

  /**
   * 2. Match complet (folosit de AI și auto-invite)
   */

  /**
   * 3. Prețuri medii pe categorii
   */
  app.get("/internal/average-prices", async (req, res) => {
    const categories = await prisma.providerCategory.findMany();
    return res.send(categories.map((c) => ({
      id: c.id,
      name: c.name,
      averagePrice: c.averagePrice,
    })));
  });
}

export default providersRoutes;
