import { proxyRequest } from '@/lib/bff/proxy';
export const dynamic = 'force-dynamic';
export async function PUT(req, { params }) {
    const p = await params;
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, `/offers/${p.id}`);
}
