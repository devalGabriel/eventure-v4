// services/providers-service/src/routes/publicCatalog.js
import { prisma } from '../lib/prisma.js';

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({ send: (body) => res.status(status).json(body) });
  return f;
}

export async function publicCatalogRoutes(app) {
  // GET /v1/provider-categories
  app.get("/v1/provider-categories", async (req, res) => {
    const reply = makeReply(res);

    const categories = await prisma.providerCategory.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return reply.send(categories);
  });
}
