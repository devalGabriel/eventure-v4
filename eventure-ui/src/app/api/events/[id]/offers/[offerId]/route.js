// src/app/api/events/[id]/offers/[offerId]/route.js
import { proxyRequest } from '@/lib/bff/proxy';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  const p = await params
  return proxyRequest(req, process.env.EVENTS_INTERNAL_URL, `/events/${p.id}/offers/${p.offerId}`);
}
