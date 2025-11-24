// src/app/api/admin/event-types/route.js
import { proxyRequest } from '@/lib/bff/proxy';

export async function GET(req) {
  // doar forward către events-service /admin/event-types
      const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, '/admin/event-types');
}
