// src/app/api/events/[id]/budget-estimate/route.js
import { proxyRequest } from '@/lib/bff/proxy';

export async function GET(req, { params }) {
    const p = await params
        const base = process.env.EVENTS_INTERNAL_URL;

  return proxyRequest(req, base, `/events/${p.id}/budget-estimate`);
}
