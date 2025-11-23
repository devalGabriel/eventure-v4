import { proxyRequest } from '@/lib/bff/proxy';
export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
    const p = await params;
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, `/programs/${p.id}`);
}
export async function DELETE(req, { params }) {
  const p = await params;
  return proxyRequest(
    req,
    process.env.EVENTS_INTERNAL_URL,
    `/programs/${p.id}`
  );
}