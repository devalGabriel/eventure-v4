import { prisma } from '../lib/prisma.js';

/**
 * Check if provider is available on event date.
 */
export async function isProviderAvailable(providerId, eventDate) {
  if (!eventDate) return true; // if no date provided → assume OK

  const unavailable = await prisma.providerUnavailable.findFirst({
    where: {
      providerId,
      date: eventDate,
    },
  });

  return !unavailable;
}
