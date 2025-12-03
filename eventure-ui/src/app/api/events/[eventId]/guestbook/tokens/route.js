import { NextResponse } from "next/server";

const EVENTS_URL = process.env.EVENTS_INTERNAL_URL || "http://localhost:4002";

export async function GET(req, { params }) {
  const { eventId } = params;
  const cookie = req.headers.get("cookie") || "";

  const r = await fetch(`${EVENTS_URL}/events/${eventId}/guestbook/tokens`, {
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

export async function POST(req, { params }) {
  const { eventId } = params;
  const cookie = req.headers.get("cookie") || "";
  const body = await req.text();

  const r = await fetch(`${EVENTS_URL}/events/${eventId}/guestbook/tokens`, {
    method: "POST",
    headers: {
      cookie,
      "content-type": "application/json",
    },
    body,
  });
  const txt = await r.text();
  return new NextResponse(txt || "{}", {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json",
    },
  });
}
