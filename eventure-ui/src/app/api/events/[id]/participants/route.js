import { NextResponse } from "next/server";

const EVENTS_URL = process.env.EVENTS_INTERNAL_URL || "http://localhost:4003";

export async function GET(req, { params }) {
  const p = await params;
  const { id } = p;
  const cookie = req.headers.get("cookie") || "";

  const r = await fetch(`${EVENTS_URL}/events/${id}/participants`, {
    headers: { cookie },
  });

  const txt = await r.text();
  return new NextResponse(txt || "[]", {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json",
    },
  });
}
