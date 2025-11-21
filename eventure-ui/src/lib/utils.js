'use server'
import { headers as nextHeaders } from 'next/headers';

async function getCookieHeader() {
  try {
    const h = await nextHeaders();
    const v = h.get('cookie');
    return v || '';
  } catch {
    return '';
  }
}

export async function getRoleServer() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || '';
  const cookieHeader = await getCookieHeader();

  try {
    const r = await fetch(`${base}/api/auth/me`, {
      method: 'GET',
      cache: 'no-store',
      headers: cookieHeader ? { Cookie: cookieHeader } : {}
    });
    // endpointul nostru întoarce 200 cu {role:'client'} chiar și când auth răspunde 401,
    // deci aici .ok poate fi true. Totuși păstrăm fallback.
    if (!r.ok) return 'client';
    const me = await r.json().catch(() => ({}));
    return me?.role || 'client';
  } catch {
    return 'client';
  }
}