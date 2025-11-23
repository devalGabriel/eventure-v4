// src/app/api/events/[id]/tasks/generate/route.js
import { proxyRequest } from '@/lib/bff/proxy';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const p = await params;
  return proxyRequest(
    req,
    process.env.EVENTS_INTERNAL_URL,
    `/events/${p.id}/tasks/generate`
  );
}
