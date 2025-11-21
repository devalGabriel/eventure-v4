// src/lib/server/providersProxy.js
'use server';

import { cookies, headers as nextHeaders } from 'next/headers';

export async function providersFetch(path, init = {}) {
  const base = process.env.PROVIDERS_SERVICE_URL || 'http://localhost:4004/v1';

  // asigurăm slash corect
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${normalizedPath}`;
  console.log("url", url)
  const cookieStore = await cookies();
  const incomingHeaders = await nextHeaders();

  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');

  // copiem un eventual x-request-id / x-trace-id
  const traceId =
    incomingHeaders.get('x-request-id') ||
    incomingHeaders.get('x-trace-id');
  if (traceId) {
    headers.set('x-request-id', traceId);
  }

  // Authorization:
  // 1. Dacă vine deja în header (ex: request făcut din alt backend)
  // 2. Altfel, căutăm token-ul în cookie-uri (ajustezi numele dacă ai altul)
  let auth =
    incomingHeaders.get('authorization') ||
    incomingHeaders.get('Authorization');
    if (!auth) {
      const token =
      cookieStore.get('access_token')?.value ||
      cookieStore.get('evt_session')?.value;
      if (token) {
        auth = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
  }

  if (auth) {
    headers.set('Authorization', auth);
  }

  // content-type pentru body JSON
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store'
  });

  return res;
}

// helper mic pentru a forward-ui JSON / text
export async function forwardProviderResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  const status = res.status;

  const text = await res.text();

  // dacă pare JSON, încercăm să parsăm
  if (contentType.includes('application/json')) {
    try {
      const data = text ? JSON.parse(text) : null;
      return { status, body: data, contentType: 'application/json' };
    } catch {
      // cade mai jos pe text simplu
    }
  }

  return { status, body: text, contentType: contentType || 'text/plain' };
}
