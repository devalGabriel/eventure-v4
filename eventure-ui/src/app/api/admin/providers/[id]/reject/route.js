import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(_req, { params }) {
  const USERS_URL = process.env.USERS_INTERNAL_URL?.replace(/\/$/, '');
  const NOTIF_URL = process.env.NOTIFICATIONS_INTERNAL_URL?.replace(/\/$/, '');

  if (!USERS_URL || !NOTIF_URL) {
    return NextResponse.json({ ok:false, error:'Missing internal URLs' }, { status:500 });
  }
  const userId = params?.id;

  // menținem rolul client
  await fetch(`${USERS_URL}/v1/users/${userId}/roles`, {
    method: 'PATCH',
    headers: { 'content-type':'application/json' },
    body: JSON.stringify({ add: ['client'], remove: ['provider'] })
  }).catch(()=>{});

  await fetch(`${NOTIF_URL}/internal/notify`, {
    method: 'POST',
    headers: { 'content-type':'application/json' },
    body: JSON.stringify({
      authUserId: String(userId),
      title: 'Provider declined',
      body: 'Your provider request was declined.',
      type: 'PROVIDER_DECISION',
      data: { userId, status:'DECLINED', at: new Date().toISOString() }
    })
  });

  return NextResponse.json({ ok:true });
}
