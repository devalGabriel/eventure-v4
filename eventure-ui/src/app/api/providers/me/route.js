import { proxyRequest } from '@/lib/bff/proxy';
export const dynamic = 'force-dynamic';
export async function GET(req) {
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, '/providers/me');
}
export async function PUT(req) {
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, '/providers/me');
}
