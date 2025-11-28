// src/app/api/notifications/mark-read-context/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function getUserIdFromAuth() {
  const jar = await cookies();
  const cookieHeader = jar.getAll().map(c => `${c.name}=${encodeURIComponent(c.value)}`).join('; ');
  const AUTH = (process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4001').replace(/\/$/, '');
  const res = await fetch(`${AUTH}/auth/me`, { headers: { Cookie: cookieHeader }, cache: 'no-store' });
  if (!res.ok) return null;
  const me = await res.json();
  return me?.id ?? me?.user?.id ?? null;
}

export async function POST(request) {
  const userId = await getUserIdFromAuth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const body = await request.json().catch(() => ({}));
  const NOTIF = (process.env.NOTIFICATIONS_INTERNAL_URL || 'http://localhost:4105').replace(/\/$/, '');

  const res = await fetch(`${NOTIF}/v1/notifications/mark-read-context`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...body, authUserId: userId }),
  });

  const data = res.ok ? await res.json() : { updated: 0 };
  return NextResponse.json(data, { status: res.status || 200 });
}
