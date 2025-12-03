// eventure-ui/src/app/api/events/[id]/guestbook/[entryId]/route.js
import { NextResponse } from "next/server";

const EVENTS_URL = process.env.EVENTS_URL || "http://localhost:4002";

export async function DELETE(req, { params }) {
    const p = await params;
  const { id, entryId } = p;
  const cookie = req.headers.get("cookie") || "";

  const r = await fetch(
    `${EVENTS_URL}/events/${id}/guestbook/${entryId}`,
    {
      method: "DELETE",
      headers: {
        cookie,
        "x-forwarded-host": req.headers.get("host") || "",
      },
    }
  );

  const text = await r.text();
  return new NextResponse(text || "{}", {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") || "application/json" },
  });
}
