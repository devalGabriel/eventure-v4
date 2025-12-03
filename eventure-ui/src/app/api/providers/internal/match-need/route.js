// src/app/api/providers/internal/match-need/route.js
import { NextResponse } from "next/server";
import {
  providersFetch,
  forwardProviderResponse,
} from "@/lib/server/providersProxy";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const res = await providersFetch("/internal/match-need", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const { status, body: data, contentType } = await forwardProviderResponse(
    res
  );

  if (contentType === "application/json") {
    return NextResponse.json(data, { status });
  }

  return new NextResponse(data, {
    status,
    headers: { "Content-Type": contentType },
  });
}
