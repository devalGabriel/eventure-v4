// src/app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { usersFetch, forwardUsersResponse } from '@/lib/server/usersProxy';

export async function GET(req) {
  const url = new URL(req.url);
  const search = url.search || '';

  const upstream = await usersFetch(`/admin/users${search}`, {
    method: 'GET',
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
