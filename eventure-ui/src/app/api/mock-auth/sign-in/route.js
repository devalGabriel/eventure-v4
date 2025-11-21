// src/app/api/mock-auth/sign-in/route.js
import { NextResponse } from 'next/server';
export async function POST(req) {
  const body = await req.json();
  if (body.email?.includes('@') && body.password?.length >= 6) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('evt_session', 'devsession', { httpOnly: false, path: '/', sameSite:'lax' });
    return res;
  }
  return NextResponse.json({ code:'ERR_INVALID_CREDENTIALS' }, { status: 401 });
}
