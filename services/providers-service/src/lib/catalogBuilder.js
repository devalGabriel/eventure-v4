import { prisma } from '../lib/prisma.js';

export async function buildFullCatalog() {
  const categories = await prisma.providerCategory.findMany({
    include: {
      subcategories: {
        include: { tags: true },
      },
    },
  });

  return {
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      averagePrice: c.averagePrice,
      subcategories: c.subcategories.map((s) => ({
        id: s.id,
        name: s.name,
        parentCategoryId: s.categoryId,
        tags: s.tags.map((t) => ({
          id: t.id,
          label: t.label,
        })),
      })),
    })),
  };
}
