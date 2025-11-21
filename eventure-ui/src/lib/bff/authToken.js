// src/lib/bff/authToken.js

function parseCookieFromHeader(cookieHeader = '') {
  const out = {};
  cookieHeader.split(';').forEach(part => {
    const [k, ...rest] = part.split('=');
    if (!k) return;
    const key = k.trim();
    const val = decodeURIComponent((rest.join('=') || '').trim());
    if (key) out[key] = val;
  });
  return out;
}

// adaugăm toate denumirile “posibile” ale token-ului
const TOKEN_COOKIE_KEYS = [
  'evt_jwt',
  'evt_token',
  'session_token',
  'evt_session',
  'access_token',
  'auth_token',
  'jwt'
];

export async function getAuthTokenFromRequest(req) {
  // 1) Authorization: Bearer ...
  const authH = req.headers.get('authorization');
  if (authH && authH.toLowerCase().startsWith('bearer ')) {
    return authH.substring(7).trim();
  }

  // 2) Din Cookie
  const cookieHeader = req.headers.get('cookie') || '';
  if (cookieHeader) {
    const cookies = parseCookieFromHeader(cookieHeader);
    for (const key of TOKEN_COOKIE_KEYS) {
      if (cookies[key]) return cookies[key];
    }
  }

  // 3) Fallback (opțional): exchange la AUTH_URL/auth/token cu cookie-urile
  const AUTH_URL = process.env.AUTH_URL?.replace(/\/$/, '');
  if (!AUTH_URL) return null;

  try {
    const r = await fetch(`${AUTH_URL}/auth/token`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Cookie: cookieHeader
      },
      cache: 'no-store'
    });
    if (!r.ok) return null;
    const data = await r.json().catch(() => ({}));
    return data?.token || null;
  } catch {
    return null;
  }
}
