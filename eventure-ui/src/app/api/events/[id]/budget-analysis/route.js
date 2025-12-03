// src/app/api/events/[id]/budget-analysis/route.js
import { NextResponse } from "next/server";

const EVENTS_INTERNAL_URL =
  process.env.EVENTS_INTERNAL_URL || "http://localhost:4007";

export async function GET(req, { params }) {
    const p = await params
  const { id } = p;

  const url = `${EVENTS_INTERNAL_URL}/events/${id}/budget-analysis`;

  try {
    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        // forward auth/cookies către events-service
        cookie: req.headers.get("cookie") || "",
        authorization: req.headers.get("authorization") || "",
      },
    });

    const text = await upstream.text();
    const contentType =
      upstream.headers.get("content-type") || "application/json";

    return new NextResponse(text || null, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (err) {
    console.error("Proxy budget-analysis error:", err);
    return NextResponse.json(
      { error: "Budget analysis proxy failed" },
      { status: 500 }
    );
  }
}
