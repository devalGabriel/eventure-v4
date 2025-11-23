// src/lib/bff/response.js
export async function relayResponse(res) {
  // Copiază status + body + content-type. Filtrăm hop-by-hop headers.
  const excluded = new Set([
    'content-length',
    'connection',
    'keep-alive',
    'transfer-encoding',
    'upgrade',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
  ]);

  const headers = new Headers();
  res.headers.forEach((v, k) => {
    if (!excluded.has(k.toLowerCase())) headers.set(k, v);
  });
  console.log("RESPONSE STATUS: ", res.status)
  const status = res.status ?? 200;

  // 🔴 204 / 304 nu au voie să aibă body
  if (status === 204 || status === 304) {
    return new Response(null, { status, headers });
  }

  // Pentru restul statusurilor, păstrăm behavior-ul actual
  const body =
    res.body ??
    (await res.arrayBuffer().catch(() => undefined));

  return new Response(body, { status, headers });
}
