import { NextResponse } from "next/server";

const EVENTS_URL = process.env.EVENTS_URL || "http://localhost:4002";

export async function GET(req, { params }) {
  const { eventId } = params;
  const cookie = req.headers.get("cookie") || "";

  const r = await fetch(`${EVENTS_URL}/events/${eventId}/guestbook`, {
    headers: { cookie },
  });

  const txt = await r.text();
  return new NextResponse(txt || "{}", {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json",
    },
  });
}
