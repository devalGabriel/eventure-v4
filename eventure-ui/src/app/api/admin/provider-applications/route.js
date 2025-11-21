import { proxyRequest } from '@/lib/bff/proxy';
export const dynamic = 'force-dynamic';
export async function GET(req) {
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, '/admin/provider-applications');
}
