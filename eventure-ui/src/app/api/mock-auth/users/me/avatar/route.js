// src/app/api/mock-users/users/me/avatar/route.js
import { NextResponse } from 'next/server';
export async function POST() {
  // primește FormData, returnează un URL fake
  return NextResponse.json({ url: '/avatar-demo.png' });
}
