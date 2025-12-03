// eventure-ui/src/app/api/events/[id]/guestbook/route.js
import { NextResponse } from "next/server";

const EVENTS_URL = process.env.EVENTS_INTERNAL_URL || "http://localhost:4003";

export async function GET(req, { params }) {
  const p = await params;
  const { id } = p;
  const cookie = req.headers.get("cookie") || "";

  const r = await fetch(`${EVENTS_URL}/events/${id}/guestbook`, {
    headers: {
      cookie,
      "x-forwarded-host": req.headers.get("host") || "",
    },
  });

  const text = await r.text();
  return new NextResponse(text || "[]", {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") || "application/json" },
  });
}

export async function POST(req, { params }) {
  const p = await params;
  const { id } = p;
  const cookie = req.headers.get("cookie") || "";
  const body = await req.text();

  const r = await fetch(`${EVENTS_URL}/events/${id}/guestbook`, {
    method: "POST",
    headers: {
      cookie,
      "content-type": "application/json",
      "x-forwarded-host": req.headers.get("host") || "",
    },
    body,
  });

  const text = await r.text();
  return new NextResponse(text || "{}", {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") || "application/json" },
  });
}
