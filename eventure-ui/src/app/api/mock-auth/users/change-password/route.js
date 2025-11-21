// src/app/api/mock-users/users/change-password/route.js
import { NextResponse } from 'next/server';
export async function POST(req) {
  const b = await req.json();
  if (!b.oldPassword || !b.newPassword || b.newPassword.length < 6) {
    return NextResponse.json({ code:'ERR_VALIDATION' }, { status: 400 });
  }
  return NextResponse.json({ ok:true });
}
