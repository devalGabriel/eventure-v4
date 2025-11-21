// src/app/api/groups/[id]/route.js
import { proxyRequest } from '@/lib/bff/proxy';
export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const base = process.env.EVENTS_INTERNAL_URL;
  return fetch(`${base.replace(/\/$/,'')}/groups/${params.id}`, { headers: { accept: 'application/json' } });
}
export async function PUT(req, { params }) {
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, `/groups/${params.id}`);
}
export async function DELETE(req, { params }) {
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, `/groups/${params.id}`);
}
