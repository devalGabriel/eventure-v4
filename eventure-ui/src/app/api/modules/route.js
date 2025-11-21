import { MODULES_SERVICE_URL } from "@/lib/services";

export async function GET() {
  const r = await fetch(`${MODULES_SERVICE_URL}/modules`, { cache: "no-store" });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": r.headers.get("content-type") || "application/json" } });
}
