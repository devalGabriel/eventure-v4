// src/app/api/admin/event-templates/[id]/route.js
import { proxyRequest } from '@/lib/bff/proxy';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const p = await params;
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, `/admin/event-templates/${p.id}`);
}

export async function PUT(req, { params }) {
  const p = await params;
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, `/admin/event-templates/${p.id}`);
}

export async function DELETE(req, { params }) {
  const p = await params;
  const base = process.env.EVENTS_INTERNAL_URL;
  return proxyRequest(req, base, `/admin/event-templates/${p.id}`);
}
