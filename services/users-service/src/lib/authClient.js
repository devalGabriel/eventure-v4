// services/users-service/src/lib/authClient.js
// Folosește fetch nativ din Node 18+ (nu mai ai nevoie de node-fetch)
const AUTH_BASE = (
  process.env.AUTH_BASE_URL ||
  process.env.AUTH_SERVICE_URL ||
  process.env.AUTH_URL ||               // ✅ fallback
  'http://localhost:4001'
).replace(/\/$/, '');

async function authMe(cookieHeader = '') {
  const res = await fetch(`${AUTH_BASE}/auth/me`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
    },
    // server-to-server; cookies le forwardăm manual prin header
    // credentials nu e strict necesar, dar nu strică:
    credentials: 'include',
  });

  if (res.status === 401) return null;
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`AUTH /me failed: ${res.status} ${txt}`);
  }
  return res.json();
}

module.exports = { authMe };
