// src/app/api/admin/clients/route.js
import { NextResponse } from "next/server";
import { usersFetch, forwardUsersResponse } from "@/lib/server/usersProxy";

export async function GET(req) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  // preluăm parametrii existenți (page, pageSize, q, isActive etc.)
  const forwarded = new URLSearchParams(searchParams);

  // ne asigurăm că rolul este CLIENT
  if (!forwarded.has("role")) {
    forwarded.set("role", "CLIENT");
  }

  const query = forwarded.toString();
  const path = `/admin/users${query ? `?${query}` : ""}`;

  const upstream = await usersFetch(path, {
    method: "GET",
    headers: {
      "x-user-role": "ADMIN", // validare minimală în users-service
    },
  });

  const forwardedRes = await forwardUsersResponse(upstream);

  return new NextResponse(
    forwardedRes.contentType === "application/json"
      ? JSON.stringify(forwardedRes.body ?? null)
      : forwardedRes.body ?? "",
    {
      status: forwardedRes.status,
      headers: { "Content-Type": forwardedRes.contentType },
    }
  );
}
