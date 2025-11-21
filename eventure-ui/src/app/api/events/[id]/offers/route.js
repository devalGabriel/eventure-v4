import { proxyRequest } from '@/lib/bff/proxy';
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const p = await params;
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, `/events/${p.id}/offers`);
}
export async function POST(req, { params }) {
  const p = await params;
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, `/events/${p.id}/offers`);
}
