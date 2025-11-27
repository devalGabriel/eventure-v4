// src/app/api/providers/me/invitations/route.js
import { proxyRequest } from '@/lib/bff/proxy';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const base = process.env.EVENTS_INTERNAL_URL;
  // proxy către events-service: GET /providers/me/invitations
  return proxyRequest(req, base, '/providers/me/invitations');
}
