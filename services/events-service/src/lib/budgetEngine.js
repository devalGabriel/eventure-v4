import {prisma} from "../db.js";

// Template weight by event type
function getTemplateWeights(eventType) {
  switch (eventType) {
    case "wedding":
      return {
        1: 0.35,
        2: 0.12,
        3: 0.07,
        4: 0.09,
        5: 0.08,
        6: 0.03,
        7: 0.02,
        8: 0.04,
      };
    case "corporate":
      return {
        1: 0.30,
        2: 0.10,
        5: 0.06,
        7: 0.05,
      };
    default:
      return {};
  }
}

export async function computeBudgetAnalysis(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  const brief = await prisma.eventBrief.findUnique({
    where: { eventId },
  });

  const needs = await prisma.eventNeed.findMany({
    where: { eventId },
  });

  const acceptedOffers = await prisma.eventOffer.findMany({
    where: { eventId, status: "ACCEPTED" },
  });

  const weights = getTemplateWeights(event.eventType);

  // 1. Ideal budget (from initialBudget * weights)
  const idealBudget = {};
  if (brief?.initialBudget) {
    const base = Number(brief.initialBudget);
    Object.entries(weights).forEach(([catId, w]) => {
      idealBudget[catId] = Math.round(base * w);
    });
  }

  // 2. Planned budget (sum of needs)
  const plannedBudget = {};
  needs.forEach((n) => {
    const cat = n.categoryId;
    if (!cat) return;
    if (!plannedBudget[cat]) plannedBudget[cat] = 0;
    plannedBudget[cat] += Number(n.budgetPlanned || 0);
  });

  // 3. Real budget (accepted offers)
  const realBudget = {};
  acceptedOffers.forEach((o) => {
    const need = needs.find((n) => n.id === o.needId);
    if (!need || !need.categoryId) return;
    const cat = need.categoryId;
    if (!realBudget[cat]) realBudget[cat] = 0;
    realBudget[cat] += Number(o.amount || 0);
  });

  return {
    idealBudget,
    plannedBudget,
    realBudget,
  };
}
