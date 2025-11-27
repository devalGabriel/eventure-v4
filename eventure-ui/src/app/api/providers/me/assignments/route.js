// src/app/api/providers/me/assignments/route.js
import { proxyRequest } from '@/lib/bff/proxy';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const base = process.env.EVENTS_INTERNAL_URL;
  // GET /providers/me/assignments
  return proxyRequest(req, base, '/providers/me/assignments');
}
