// src/app/api/admin/users/[id]/audit/route.js
import { NextResponse } from 'next/server';
import { usersFetch, forwardUsersResponse } from '@/lib/server/usersProxy';

async function getUserIdFromAuth(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const AUTH = (process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4001').replace(/\/$/, '');

  const res = await fetch(`${AUTH}/auth/me`, {
    method: 'GET',
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });

  if (!res.ok) return null;
  const me = await res.json().catch(() => null);
  return me?.id ?? null;
}

export async function GET(req, { params }) {
  const p = await params;
  const { id } = p;

  const actorId = await getUserIdFromAuth(req);

  const upstream = await usersFetch(`/admin/users/${id}/audit`, {
    method: 'GET',
    headers: {
      ...(actorId ? { 'x-actor-id': String(actorId) } : {}),
      'x-user-role': 'ADMIN',
    },
  });

  const forwarded = await forwardUsersResponse(upstream);

  return new NextResponse(
    forwarded.contentType === 'application/json'
      ? JSON.stringify(forwarded.body ?? null)
      : forwarded.body ?? '',
    {
      status: forwarded.status,
      headers: { 'Content-Type': forwarded.contentType },
    }
  );
}
