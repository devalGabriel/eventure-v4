import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(_req, { params }) {
  const USERS_URL = process.env.USERS_INTERNAL_URL?.replace(/\/$/, '');
  const AUTH_URL = process.env.AUTH_INTERNAL_URL?.replace(/\/$/, '');
  const NOTIF_URL = process.env.NOTIFICATIONS_INTERNAL_URL?.replace(/\/$/, '');

  if (!USERS_URL || !AUTH_URL || !NOTIF_URL) {
    return NextResponse.json({ ok:false, error:'Missing internal URLs' }, { status:500 });
  }

  const userId = params?.id;

  // 1) roles in users-service
  const r1 = await fetch(`${USERS_URL}/v1/users/${userId}/roles`, {
    method: 'PATCH',
    headers: { 'content-type':'application/json' },
    body: JSON.stringify({ add: ['provider'], remove: ['client'] })
  });
  if (!r1.ok) {
    const t = await r1.text();
    return NextResponse.json({ ok:false, step:'users', body:t }, { status: r1.status });
  }

  // 2) force-logout in auth-service
  const r2 = await fetch(`${AUTH_URL}/internal/users/${userId}/force-logout`, { method: 'POST' });
  if (!r2.ok) {
    const t = await r2.text();
    return NextResponse.json({ ok:false, step:'auth', body:t }, { status: r2.status });
  }

  // 3) notify user
  await fetch(`${NOTIF_URL}/internal/notify`, {
    method: 'POST',
    headers: { 'content-type':'application/json' },
    body: JSON.stringify({
      authUserId: String(userId),
      title: 'Provider approved',
      body: 'Your provider access was approved. Please sign in again.',
      type: 'PROVIDER_DECISION',
      data: { userId, status:'APPROVED', at: new Date().toISOString() }
    })
  });

  return NextResponse.json({ ok:true });
}
