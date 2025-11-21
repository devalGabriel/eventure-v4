import { MODULES_SERVICE_URL } from "@/lib/services";
export async function DELETE(_req, { params }) {
  const p = await params;
  const r = await fetch(`${MODULES_SERVICE_URL}/modules/slug/${p.slug}`, { method: "DELETE" });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": r.headers.get("content-type") || "application/json" } });
}
