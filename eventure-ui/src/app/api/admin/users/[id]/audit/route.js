// src/app/api/admin/users/[id]/audit/route.js
import { NextResponse } from 'next/server';
import { usersFetch, forwardUsersResponse } from '@/lib/server/usersProxy';

export async function GET(req, { params }) {
    const p = await params
  const { id } = p;

  const upstream = await usersFetch(`/admin/users/${id}/audit`, {
    method: 'GET',
    headers: {
      'x-user-role': 'ADMIN', // dev-simulated; în producție se bazează pe JWT
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
