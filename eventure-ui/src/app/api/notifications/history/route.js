// eventure-ui/src/app/api/notifications/history/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// extrage userId sigur din AUTH (/auth/me)
async function getUserIdFromAuth() {
  const jar = await cookies();
  const cookieHeader = jar
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ');

  const AUTH = (process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4001').replace(/\/$/, '');
  const res = await fetch(`${AUTH}/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) return null;

  const me = await res.json();
  return me?.id ?? me?.user?.id ?? null;
}

export async function GET() {
  const userId = await getUserIdFromAuth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const NOTIF = (process.env.NEXT_PUBLIC_NOTIF_URL || 'http://localhost:4105').replace(/\/$/, '');
  const url = `${NOTIF}/v1/notifications?authUserId=${encodeURIComponent(
    userId,
  )}&limit=30`;

  const res = await fetch(url, { cache: 'no-store' });

  const data = res.ok ? await res.json() : [];
  return NextResponse.json(data);
}
