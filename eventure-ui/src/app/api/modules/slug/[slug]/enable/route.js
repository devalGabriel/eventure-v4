import { MODULES_SERVICE_URL } from "@/lib/services";
export async function POST(_req, { params }) {
  const p = await params;
  const r = await fetch(`${MODULES_SERVICE_URL}/modules/slug/${p.slug}/enable`, { method: "POST" });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": r.headers.get("content-type") || "application/json" } });
}
