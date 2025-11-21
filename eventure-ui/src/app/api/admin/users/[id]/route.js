// src/app/api/admin/users/[id]/route.js
import { NextResponse } from 'next/server';
import { usersFetch, forwardUsersResponse } from '@/lib/server/usersProxy';

export async function GET(req, { params }) {
  const p = await params
  const { id } = p;

  const upstream = await usersFetch(`/users/${id}`, {
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
    },
  );
}

// PATCH profil (nume, phone, locale, isActive etc.)
export async function PATCH(req, { params }) {
  const p = await params
  const { id } = p;
  const body = await req.text();

  const upstream = await usersFetch(`/users/${id}`, {
    method: 'PATCH',
    body,
    headers: {
      'Content-Type': 'application/json',
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
    },
  );
}
