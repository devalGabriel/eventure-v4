// src/app/api/admin/users/[id]/force-logout/route.js
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  const { id } = params;

  const AUTH = (process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4001')
    .replace(/\/$/, '');

  const res = await fetch(`${AUTH}/internal/users/${id}/force-logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const text = await res.text();
  const ok = res.ok;

  return new NextResponse(
    ok ? text || JSON.stringify({ ok: true }) : text || '',
    {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    }
  );
}
