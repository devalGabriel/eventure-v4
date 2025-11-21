// src/app/api/mock-auth/forgot-password/route.js
import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ ok: true });
}
