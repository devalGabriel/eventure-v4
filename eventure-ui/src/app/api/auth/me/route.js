// src/app/api/auth/me/route.js
export const dynamic = 'force-dynamic';

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

// ordinea e importantă: primele au prioritate
const TOKEN_COOKIE_KEYS = [
  'evt_jwt',
  'evt_token',
  'session_token',
  'access_token',
  'auth_token',
  'evt_session',    // <- add your real cookie names here
  'jwt'
];

export async function GET(req) {
  const AUTH_URL = process.env.AUTH_URL?.replace(/\/$/, '');

  if (!AUTH_URL) {
    // Fallback: fără auth-service, tratăm ca "client"
    return new Response(JSON.stringify({ role: 'client' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  const cookieHeader = req.headers.get('cookie') || '';
  const authHeaderIn = req.headers.get('authorization') || '';
  const cookies = parseCookieFromHeader(cookieHeader);

  // 1) încearcă să formezi Authorization din cookie
  let bearer = null;
  for (const key of TOKEN_COOKIE_KEYS) {
    if (cookies[key]) { bearer = `Bearer ${cookies[key]}`; break; }
  }
  // 2) dacă n-ai găsit token cookie, forwardează Authorization primit (dacă există)
  if (!bearer && authHeaderIn && authHeaderIn.toLowerCase().startsWith('bearer ')) {
    bearer = authHeaderIn;
  }
  // 3) construim headerele către auth-service
  const headersToAuth = {
    Accept: 'application/json',
    // Păstrăm și Cookie, în caz că auth-service știe să-și scoată singur tokenul
    Cookie: cookieHeader
  };
  if (bearer) headersToAuth.Authorization = bearer;
  try {
    const r = await fetch(`${AUTH_URL}/auth/me`, {
      method: 'GET',
      headers: headersToAuth,
      cache: 'no-store'
    });
    console.log('Auth service /auth/me responded with status:', r);
    // dacă auth respinge (401), întoarcem 200 cu role: client (UI rămâne OK)
    if (r.status === 401) {
      return new Response(JSON.stringify({ role: 'client' }), {
        status: 200, // important pt dashboard
        headers: { 'content-type': 'application/json' }
      });
    }
    console.log('Auth service /auth/me responded with status:', r.status);
    const contentType = r.headers.get('content-type') || 'application/json';
    const body = await r.text();
    
    return new Response(body, { status: r.status, headers: { 'content-type': contentType } });
  } catch (e) {
    console.error('Error fetching auth service /auth/me:', e);
    // fallback de siguranță
    return new Response(JSON.stringify({ role: 'client' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }
}
