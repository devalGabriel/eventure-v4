// src/app/api/admin/providers/[id]/admin-notes/route.js
import { NextResponse } from "next/server";
import {
  providersFetch,
  forwardProviderResponse,
} from "@/lib/server/providersProxy";

export async function GET(_req, { params }) {
  const p = await params
  const { id } = p;

  // /v1 e deja în PROVIDERS_SERVICE_URL din providersProxy
  const upstream = await providersFetch(`/providers/${id}/admin-notes`, {
    method: "GET",
  });
  const { status, body, contentType } = await forwardProviderResponse(upstream);

  return new NextResponse(
    contentType === "application/json"
      ? JSON.stringify(body ?? null)
      : body ?? "",
    {
      status,
      headers: { "content-type": contentType || "text/plain" },
    }
  );
}

export async function POST(req, { params }) {
    const p = await params
  const { id } = p;
  const rawBody = await req.text(); // JSON string

  const upstream = await providersFetch(`/providers/${id}/admin-notes`, {
    method: "POST",
    body: rawBody,
  });
  const { status, body, contentType } = await forwardProviderResponse(upstream);

  return new NextResponse(
    contentType === "application/json"
      ? JSON.stringify(body ?? null)
      : body ?? "",
    {
      status,
      headers: { "content-type": contentType || "text/plain" },
    }
  );
}
