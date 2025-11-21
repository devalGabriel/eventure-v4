// src/app/api/admin/users/[id]/roles/route.js
import { NextResponse } from 'next/server';
import { usersFetch, forwardUsersResponse } from '@/lib/server/usersProxy';

export async function PATCH(req, { params }) {
    const p = await params
  const { id } = p;
  const body = await req.text();

  const upstream = await usersFetch(`/users/${id}/roles`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'ADMIN',
    },
    body,
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
