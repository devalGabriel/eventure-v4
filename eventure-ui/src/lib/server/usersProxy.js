// src/lib/server/usersProxy.js
"use server";

import { cookies, headers as nextHeaders } from "next/headers";

export async function usersFetch(path, init = {}) {
  const base =
    process.env.NEXT_PUBLIC_USERS_URL_V1 || "http://localhost:4102/v1";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${normalizedPath}`;

  const cookieStore = await cookies();
  const incomingHeaders = await nextHeaders();

  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");

  const traceId =
    incomingHeaders.get("x-request-id") ||
    incomingHeaders.get("x-trace-id");
  if (traceId) {
    headers.set("x-request-id", traceId);
  }

  // 🔐 forward Authorization (dacă există)
  let auth =
    incomingHeaders.get("authorization") ||
    incomingHeaders.get("Authorization");

  if (!auth) {
    const token =
      cookieStore.get("access_token")?.value ||
      cookieStore.get("evt_session")?.value;
    if (token) {
      auth = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
  }

  if (auth) {
    headers.set("Authorization", auth);
  }

  // 🔐 forward Cookie către users-service, ca el să poată apela /auth/me
  const cookieHeader = incomingHeaders.get("cookie");
  if (cookieHeader && !headers.has("cookie")) {
    headers.set("cookie", cookieHeader);
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  return res;
}

export async function forwardUsersResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const status = res.status;
  const text = await res.text();

  if (contentType.includes("application/json")) {
    try {
      const data = text ? JSON.parse(text) : null;
      return { status, body: data, contentType: "application/json" };
    } catch {
      // dacă nu e JSON valid, rămânem pe text simplu
    }
  }

  return { status, body: text, contentType: contentType || "text/plain" };
}
