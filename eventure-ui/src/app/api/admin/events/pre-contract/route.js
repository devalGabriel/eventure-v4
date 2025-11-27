// src/app/api/admin/events/pre-contract/route.js
import { proxyRequest } from '@/lib/bff/proxy';

export const dynamic = 'force-dynamic';

// proxy direct către events-service /admin/events/pre-contract
export async function GET(req) {
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, '/admin/events/pre-contract');
}

