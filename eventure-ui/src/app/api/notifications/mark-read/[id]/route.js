// eventure-ui/src/app/api/notifications/mark-read/[id]/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

export async function PATCH(_req, { params }) {
  const userId = await getUserIdFromAuth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const id = params?.id;
  if (!id) return new NextResponse('Missing id', { status: 400 });

  const NOTIF = (process.env.NOTIFICATIONS_INTERNAL_URL || 'http://localhost:4105').replace(/\/$/, '');

  try {
    const res = await fetch(`${NOTIF}/v1/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return NextResponse.json({ error: txt || 'Failed to mark read' }, { status: res.status });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error proxying mark-read/:id', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
  }
}
