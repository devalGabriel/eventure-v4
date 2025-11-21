import { MODULES_SERVICE_URL } from "@/lib/services";
export async function GET(_req, { params }) {
  const p = await params;
  const r = await fetch(`${MODULES_SERVICE_URL}/modules/slug/${p.slug}/config`, { cache: "no-store" });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": r.headers.get("content-type") || "application/json" } });
}
export async function PUT(req, { params }) {
  const p = await params;
  const body = await req.text();
  const r = await fetch(`${MODULES_SERVICE_URL}/modules/slug/${p.slug}/config`, {
    method: "PUT", headers: { "content-type": "application/json" }, body
  });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": r.headers.get("content-type") || "application/json" } });
}
