// src/app/api/admin/users/[id]/route.js
import { NextResponse } from 'next/server';
import { usersFetch, forwardUsersResponse } from '@/lib/server/usersProxy';

export async function GET(req, { params }) {
  const p = await params;          // 👈 păstrăm pattern-ul care îți merge
  const { id } = p;

  const upstream = await usersFetch(`/admin/users/${id}/byAuthId`, {
    method: 'GET',
    headers: {
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