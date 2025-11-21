// src/lib/http/fetchServer.js
export async function apiServer(path, { method='GET', body, headers } = {}) {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || ''}${path}`;
  const init = {
    method,
    headers: { 'Accept': 'application/json', ...(body ? { 'Content-Type':'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  };
  const res = await fetch(url, init);
  return res;
}
