// src/app/api/events/[id]/attachments/route.js

import { proxyRequest } from "@/lib/bff/proxy";


export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  console.log('Attachments route GET called');
  const p = await params
  return proxyRequest(req, process.env.EVENTS_INTERNAL_URL, `/events/${p.id}/attachments`);
}

export async function POST(req, { params }) {
  // Forward multipart/form-data prin stream (body + content-type)
  const p = await params
  return proxyRequest(req, process.env.EVENTS_INTERNAL_URL, `/events/${p.id}/attachments`);
}
