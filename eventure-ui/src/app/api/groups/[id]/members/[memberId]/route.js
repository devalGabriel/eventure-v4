// src/app/api/groups/[id]/members/[memberId]/route.js
import { proxyRequest } from '@/lib/bff/proxy';
export const dynamic = 'force-dynamic';

export async function DELETE(req, { params }) {
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, `/groups/${params.id}/members/${params.memberId}`);
}
