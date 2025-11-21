// src/app/api/providers/me/groups/memberships/[id]/leave/route.js
import { NextResponse } from "next/server";
import {
  providersFetch,
  forwardProviderResponse,
} from "@/lib/server/providersProxy";

export async function POST(_request, { params }) {
  const { id } = await params;

  const res = await providersFetch(
    `/providers/me/group-memberships/${id}/leave`,
    {
      method: "POST",
    }
  );

  const { status, body, contentType } = await forwardProviderResponse(res);

  if (contentType === "application/json") {
    return NextResponse.json(body, { status });
  }

  return new NextResponse(body, {
    status,
    headers: { "Content-Type": contentType || "application/json" },
  });
}
