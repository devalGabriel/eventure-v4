'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AUTH_BASE = (process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4001').replace(/\/$/, '');
const USERS_BASE = (process.env.NEXT_PUBLIC_USERS_URL || 'http://localhost:4102').replace(/\/$/, '');

// Opțional, o poți folosi pe pagini care chiar au nevoie de profilul complet
export async function getUserRSC() {
  const store = await cookies();
  const cookieHeader = store.getAll().map(c => `${c.name}=${encodeURIComponent(c.value)}`).join('; ');
  const res = await fetch(`${AUTH_BASE}/auth/me`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: 'no-store',
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`AUTH /me failed ${res.status}`);
  return res.json();
}

export async function requireUserRSC(locale = 'ro') {
  const store = await cookies();
  const has =
    store.get('accessToken')?.value ||
    store.get('evt_session')?.value;
  if (!has) {
    redirect(`/${locale}/login?next=/${locale}/dashboard`);
  }
  return true;
}

export async function getProfileRSC() {
  const store = await cookies();
  const cookieHeader = store.getAll().map(c => `${c.name}=${encodeURIComponent(c.value)}`).join('; ');
  const res = await fetch(`${USERS_BASE}/v1/users/me`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...(cookieHeader ? { Cookie: cookieHeader } : {}) },
    cache: 'no-store',
    credentials: 'include'
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`USERS /me failed ${res.status}`);
  return res.json(); // { id, email, name, avatarUrl, roles[] }
}

export async function requireAdminRSC(locale = 'ro') {
  await requireUserRSC(locale);
  const me = await getProfileRSC();
  const roles = Array.isArray(me?.roles) ? me.roles : [];
  const isAdmin = roles.includes('ADMIN');
  if (!isAdmin) redirect(`/${locale}/dashboard`); // sau o pagină 403 dedicată, dacă dorești
  return me; // util dacă vrei să afișezi ceva în pagină
}