// src/lib/bff/response.js
export async function relayResponse(res) {
  // Copiază status + body + content-type. Filtrăm hop-by-hop headers.
  const excluded = new Set([
    'content-length', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'proxy-authenticate',
    'proxy-authorization', 'te', 'trailer'
  ]);

  const headers = new Headers();
  res.headers.forEach((v, k) => {
    if (!excluded.has(k.toLowerCase())) headers.set(k, v);
  });

  const body = res.body ? res.body : await res.arrayBuffer().catch(() => undefined);
  return new Response(body, { status: res.status, headers });
}
