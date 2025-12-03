import { isProviderAvailable } from "./availability.js";

/**
 * Scor provider vs need (0–100)
 */
export async function scoreProviderForNeed(provider, need, eventBrief) {
  let score = 0;

  // 1. Category
  const hasCategory = provider.services.some(
    (s) => s.categoryId === need.categoryId
  );
  if (hasCategory) score += 40;

  // 2. Subcategory
  const hasSub = provider.services.some(
    (s) => s.subcategoryId === need.subcategoryId
  );
  if (need.subcategoryId && hasSub) score += 15;

  // 3. Tags
  if (
    need.tagId &&
    provider.services.some((s) => {
      if (!s.tagIds) return false;
      return Array.isArray(s.tagIds) && s.tagIds.includes(need.tagId);
    })
  )
    score += 10;

  // 4. Price compatibility
  const price = provider.basePrice || provider.minPrice || 0;
  if (need.budgetPlanned) {
    const diff = Math.abs(price - need.budgetPlanned);
    if (diff <= need.budgetPlanned * 0.2) score += 20;
    else if (diff <= need.budgetPlanned * 0.4) score += 5;
  }

  // 5. Availability
  const eventDate = eventBrief?.eventDate;
  const available = await isProviderAvailable(provider.id, eventDate);
  if (available) score += 10;

  // 6. City match
  if (
    eventBrief?.city &&
    provider.city &&
    provider.city.trim().toLowerCase() === eventBrief.city.trim().toLowerCase()
  )
    score += 5;

  // 7. Experience (optional field)
  if (provider.eventsCompleted) {
    if (provider.eventsCompleted >= 20) score += 5;
    else if (provider.eventsCompleted >= 5) score += 2;
  }

  return Math.min(score, 100);
}
