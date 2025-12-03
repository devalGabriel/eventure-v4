// services/events-service/src/lib/aiNeeds.js
import { prisma } from "../db.js";

// URL-ul spre providers-service, configurabil via .env
const PROVIDERS_URL =
  process.env.PROVIDERS_URL || "http://localhost:4003";

/**
 * Returnează lista completă de nevoi recomandate
 * pe baza:
 *  - tipului evenimentului
 *  - nr invitați
 *  - stil
 *  - buget
 *  - nevoilor existente
 *  - prețurilor medii din providers-service (cache local)
 */
export async function recommendEventNeeds(event) {
  const eventId = event.id;
  const eventType = event.type || event.eventType || null;

  // 1. Brief + nevoi existente
  const brief = await prisma.eventBrief.findUnique({
    where: { eventId },
  });

  const needs = await prisma.eventNeed.findMany({
    where: { eventId },
  });

  // 2. Catalog complet din providers-service (robust + safe)
  let categories = [];
  try {
    const url = `${PROVIDERS_URL}/internal/catalog/full`;
    const catalogRes = await fetch(url, { method: "GET" });

    if (!catalogRes.ok) {
      const txt = await catalogRes.text().catch(() => "");
      console.warn(
        "AI Needs: catalog full failed",
        catalogRes.status,
        txt || ""
      );
    } else {
      const data = await catalogRes.json().catch(() => null);

      // Acceptăm mai multe forme, ca să nu crape:
      if (Array.isArray(data?.categories)) {
        categories = data.categories;
      } else if (Array.isArray(data)) {
        categories = data;
      } else if (Array.isArray(data?.rows)) {
        categories = data.rows;
      } else if (data && typeof data === "object") {
        // fallback: caută prima proprietate de tip array
        const arrKey = Object.keys(data).find((k) =>
          Array.isArray(data[k])
        );
        if (arrKey) categories = data[arrKey];
      }
    }
  } catch (err) {
    console.error("AI Needs: error fetching catalog:", err);
  }

  // dacă nu avem catalog, mai bine întoarcem listă goală
  if (!categories.length) {
    return [];
  }

  // 3. Template de greutăți în funcție de tipul evenimentului
  const templateWeights = getTemplateWeights(eventType);

  // 4. Ce servicii lipsesc? (după categoryId)
  const existingCatIds = new Set(
    needs
      .map((n) => n.categoryId)
      .filter((id) => id !== null && id !== undefined)
  );

  const recommendations = [];

  for (const cat of categories) {
    const catId = cat.id ?? cat.categoryId;
    if (catId == null) continue;

    const weight = templateWeights[catId];
    if (!weight) continue; // categoria nu e recomandată de template

    if (existingCatIds.has(catId)) continue; // deja adăugat de user

    const basePrice =
      (typeof cat.averagePrice === "number" && cat.averagePrice > 0
        ? cat.averagePrice
        : null) || 500;

    const guestCount =
      brief?.guestCount != null
        ? Number(brief.guestCount)
        : null;

    const suggestedBudget =
      guestCount && !Number.isNaN(guestCount)
        ? Math.round(basePrice * (1 + guestCount / 100))
        : basePrice;

    recommendations.push({
      categoryId: catId,
      label: cat.defaultLabel || cat.name || "Serviciu",
      subcategoryId: null,
      tagId: null,
      priority: weight >= 0.1 ? "HIGH" : "MEDIUM",
      mustHave: weight >= 0.15,
      suggestedBudget,
    });
  }

  return recommendations;
}

function getTemplateWeights(eventType) {
  const type = (eventType || "").toLowerCase();
  switch (type) {
    case "wedding":
    case "nunta":
      return {
        1: 0.35, // locație
        2: 0.12, // foto
        3: 0.07, // dj
        4: 0.09, // formație
        5: 0.08, // decor
        6: 0.03, // candy bar
        7: 0.02, // mc
        8: 0.04, // iluminat arhitectural
      };
    case "corporate":
      return {
        1: 0.3,
        2: 0.1,
        5: 0.06,
        7: 0.05,
      };
    default:
      return {};
  }
}
