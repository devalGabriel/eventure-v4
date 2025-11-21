// src/lib/http/query.js
export function toQS(params = {}) {
  const p = Object.entries(params).filter(([,v]) => v !== undefined && v !== null && v !== '');
  const usp = new URLSearchParams();
  p.forEach(([k,v]) => usp.append(k, String(v)));
  const s = usp.toString();
  return s ? `?${s}` : '';
}
