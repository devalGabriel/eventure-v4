import { NextResponse } from "next/server";

const EVENTS_URL = process.env.EVENTS_INTERNAL_URL || "http://localhost:4002";

export async function GET(req, { params }) {
  const { token } = params;

  const r = await fetch(`${EVENTS_URL}/guestbook/public/${token}`);
  const txt = await r.text();
  return new NextResponse(txt || "{}", {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json",
    },
  });
}

export async function POST(req, { params }) {
  const { token } = params;
  const body = await req.text();

  const r = await fetch(`${EVENTS_URL}/guestbook/public/${token}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
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
