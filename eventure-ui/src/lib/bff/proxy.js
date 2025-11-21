// src/lib/bff/proxy.js
import { getAuthTokenFromRequest } from './authToken';
import { relayResponse } from './response';

const HOP_BY_HOP = new Set([
  'host','connection','keep-alive','proxy-authenticate','proxy-authorization',
  'te','trailer','transfer-encoding','upgrade','content-length'
]);

function cleanHeadersFromReq(reqHeaders, extra = {}) {
  const out = new Headers();
  reqHeaders.forEach((v, k) => {
    const key = k.toLowerCase();
    if (HOP_BY_HOP.has(key)) return;
    if (key === 'cookie') return; // nu trimitem cookie-urile UI-ului la servicii
    out.set(k, v);
  });
  Object.entries(extra).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    out.set(k, v);
  });
  return out;
}

export async function proxyRequest(req, targetBase, targetPath) {
  if (!targetBase) {
    return new Response(JSON.stringify({ error: 'EVENTS_INTERNAL_URL missing' }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }

  const url = new URL(req.url);
  const qs = url.search || '';
  const target = `${targetBase.replace(/\/$/, '')}${targetPath}${qs}`;

  const token = await getAuthTokenFromRequest(req);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized (no token)' }), {
      status: 401, headers: { 'content-type': 'application/json' }
    });
  }

  const method = req.method.toUpperCase();
  const incomingCT = req.headers.get('content-type') || undefined;
  const hasBody = !(method === 'GET' || method === 'HEAD');

  const init = {
    method,
    headers: cleanHeadersFromReq(req.headers, {
      'Authorization': `Bearer ${token}`,
      'Accept': req.headers.get('accept') || 'application/json',
      ...(incomingCT ? { 'Content-Type': incomingCT } : {})
    }),
    // IMPORTANT pentru Node/Undici când forwardezi stream:
    ...(hasBody ? { body: req.body, duplex: 'half' } : {})
  };

  let res;
  try {
    res = await fetch(target, init);
  } catch (e) {
    // Diagnostice utile în răspuns
    return new Response(JSON.stringify({
      error: 'Upstream fetch failed',
      detail: String(e),
      target
    }), { status: 502, headers: { 'content-type': 'application/json' } });
  }

  if (res.status >= 400) {
    const text = await res.text().catch(() => '');
    return new Response(JSON.stringify({
      error: 'Upstream error',
      upstreamStatus: res.status,
      upstreamBody: text
    }), { status: res.status, headers: { 'content-type': 'application/json' } });
  }

  return relayResponse(res);
}
