// src/app/api/events/[id]/needs/[needId]/auto-invite/route.js
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  const p = await params;
  const { id, needId } = p;

  const base = process.env.EVENTS_INTERNAL_URL || "http://localhost:4003";
  const url = `${base}/events/${id}/needs/${needId}/auto-invite`;
  
  let body = null;
  try {
    body = await req.text(); // luăm body-ul ca text brut și îl forwardăm
  } catch {
    body = null;
  }

  const upstreamRes = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // poți forwarda și Authorization / cookies dacă ai nevoie
      cookie: req.headers.get("cookie") || "",
      authorization: req.headers.get("authorization") || "",
    },
    body,
  });

  const txt = await upstreamRes.text();

  // Dacă backend-ul răspunde JSON, returnăm JSON,
  // altfel raw text
  const contentType = upstreamRes.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    let json = null;
    try {
      json = txt ? JSON.parse(txt) : null;
    } catch {
      // dacă nu putem parsa, îl trimitem ca text
      return new NextResponse(txt || "", {
        status: upstreamRes.status,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.json(json, { status: upstreamRes.status });
  }

  return new NextResponse(txt || "", {
    status: upstreamRes.status,
    headers: { "content-type": contentType || "text/plain; charset=utf-8" },
  });
}
