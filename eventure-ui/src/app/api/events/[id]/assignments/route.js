// src/app/api/events/[id]/assignments/route.js
import { proxyRequest } from '@/lib/bff/proxy';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const p = await params;
  const base = process.env.EVENTS_INTERNAL_URL;
  // GET /events/:id/assignments
  return proxyRequest(req, base, `/events/${p.id}/assignments`);
}

export async function POST(req, { params }) {
  const p = await params;
  const base = process.env.EVENTS_INTERNAL_URL;
  // POST /events/:id/assignments
  return proxyRequest(req, base, `/events/${p.id}/assignments`);
}
