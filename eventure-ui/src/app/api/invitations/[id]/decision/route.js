import { proxyRequest } from '@/lib/bff/proxy';
export const dynamic = 'force-dynamic';
export async function POST(req, { params }) {
    const p = await params;
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, `/invitations/${p.id}/decision`);
}
