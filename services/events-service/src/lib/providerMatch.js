/**
 * Match score provider-nevoie
 * 0–100
 */
export function computeProviderMatchScore(provider, need, eventBrief) {
  let score = 0;

  // categorie/subcategorie
  if (provider.services.some((s) => s.categoryId === need.categoryId)) score += 40;
  if (
    need.subcategoryId &&
    provider.services.some((s) => s.subcategoryId === need.subcategoryId)
  )
    score += 15;

  // tag
  if (
    need.tagId &&
    provider.services.some((s) => s.tagIds?.includes?.(need.tagId))
  )
    score += 10;

  // preț vs buget
  const price = provider.basePrice || 0;
  if (need.budgetPlanned) {
    const diff = Math.abs(price - need.budgetPlanned);
    if (diff <= need.budgetPlanned * 0.2) score += 20;
  }

  // disponibilitate (placeholder simplu)
  if (provider.isAvailable) score += 10;

  // oraș
  if (
    provider.city &&
    eventBrief?.city &&
    provider.city.trim().toLowerCase() === eventBrief.city.trim().toLowerCase()
  )
    score += 5;

  return Math.min(score, 100);
}
