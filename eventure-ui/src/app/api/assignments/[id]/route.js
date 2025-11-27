// src/app/api/assignments/[id]/route.js
import { proxyRequest } from '@/lib/bff/proxy';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  const p = await params;
  const base = process.env.EVENTS_INTERNAL_URL;
  // PATCH /assignments/:id
  return proxyRequest(req, base, `/assignments/${p.id}`);
}
