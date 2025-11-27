// src/app/api/invitations/[id]/route.js
import { proxyRequest } from "@/lib/bff/proxy";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const base = process.env.EVENTS_INTERNAL_URL;
  const p = await params
  const id = Array.isArray(p?.id) ? p.id[0] : p?.id;

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing invitation id" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Proxiem spre events-service: GET /v1/invitations/:id
  return proxyRequest(req, base, `/providers/me/invitations/${id}`);
}
