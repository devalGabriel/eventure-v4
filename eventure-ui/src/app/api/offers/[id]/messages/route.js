// src/app/api/offers/[id]/messages/route.js
import { proxyRequest } from '@/lib/bff/proxy';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const p = await params;
  const base = process.env.EVENTS_INTERNAL_URL;
  // GET /offers/:id/messages
  return proxyRequest(req, base, `/offers/${p.id}/messages`);
}

export async function POST(req, { params }) {
  const p = await params;
  const base = process.env.EVENTS_INTERNAL_URL;
  // POST /offers/:id/messages
  return proxyRequest(req, base, `/offers/${p.id}/messages`);
}
