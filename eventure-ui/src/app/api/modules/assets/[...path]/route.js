import { MODULES_SERVICE_URL } from "@/lib/services";

// Fetch & stream orice fisier din modules-service sub /packages/**
export async function GET(_req, { params }) {
  const p = await params;
  // params.path e array din segmentul catch-all
  const remotePath = Array.isArray(p.path) ? p.path.join("/") : "";
  const url = `${MODULES_SERVICE_URL}/${remotePath}`;

  const r = await fetch(url, { cache: "no-store" });
  const body = await r.arrayBuffer();

  // păstrăm content-type (important pt. module JS)
  const contentType = r.headers.get("content-type") || "text/javascript; charset=utf-8";
  // mică protecție: doar /packages/*
  if (!remotePath.startsWith("packages/")) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(body, {
    status: r.status,
    headers: {
      "content-type": contentType,
      // poți adăuga cache după ce termini testele
      "cache-control": "no-store"
    }
  });
}
