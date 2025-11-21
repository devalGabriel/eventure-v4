// src/app/api/mock-auth/sign-up/route.js
import { NextResponse } from 'next/server';
export async function POST(req) {
  const body = await req.json();
  if (!body.email?.includes('@')) {
    return NextResponse.json({ code:'ERR_VALIDATION' }, { status: 400 });
  }
  if (body.email === 'exists@example.com') {
    return NextResponse.json({ code:'ERR_EMAIL_EXISTS' }, { status: 409 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('evt_session', 'devsession', { httpOnly: false, path: '/', sameSite:'lax' });
  return res;
}
