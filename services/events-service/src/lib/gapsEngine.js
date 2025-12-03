import {prisma} from "../db.js";

export async function computeGaps(eventId) {
  const needs = await prisma.eventNeed.findMany({ where: { eventId } });
  const invitations = await prisma.eventInvitation.findMany({ where: { eventId } });
  const offers = await prisma.eventOffer.findMany({ where: { eventId } });

  const gaps = [];

  for (const need of needs) {
    const invs = invitations.filter((i) => i.needId === need.id);
    const offs = offers.filter((o) => o.needId === need.id);

    const accepted = offs.some((o) => o.status === "ACCEPTED");
    const hasOffers = offs.length > 0;

    let status = "UNCOVERED";
    if (accepted) status = "COVERED";
    else if (hasOffers) status = "IN_PROGRESS";

    // RISK LEVEL
    let risk = "LOW";

    if (!hasOffers) risk = "HIGH";
    else if (offs.every((o) => Number(o.amount) > Number(need.budgetPlanned || 0) * 1.5))
      risk = "OVER_BUDGET";
    else if (offs.length < 2)
      risk = "MEDIUM";

    gaps.push({
      needId: need.id,
      label: need.label,
      status,
      risk,
      invitationsCount: invs.length,
      offersCount: offs.length,
    });
  }

  return gaps;
}
