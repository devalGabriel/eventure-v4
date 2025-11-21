import { NextResponse } from 'next/server';

export async function POST(req) {
  const g = globalThis;
  const payload = await req.json().catch(() => null);
  if (!payload?.userId) return new NextResponse('userId required', { status: 400 });

  g.__evt_notif_bus?.emit('push', {
    userId: String(payload.userId),
    title: payload.title || 'Update',
    time: payload.time || Date.now(),
    read: false,
  });

  return NextResponse.json({ ok: true });
}
