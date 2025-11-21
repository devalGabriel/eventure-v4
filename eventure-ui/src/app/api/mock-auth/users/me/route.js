// src/app/api/mock-users/users/me/route.js
import { NextResponse } from 'next/server';
export async function GET() {
  // simulăm un user CLIENT + PROVIDER ca să vezi nav dinamic
  return NextResponse.json({
    id:'u1', name:'Gabriel Pîrvu', email:'gabriel@example.com',
    roles:['CLIENT','PROVIDER'],
    avatarUrl:''
  });
}
export async function PATCH(req) {
  const body = await req.json();
  if (body.email && !body.email.includes('@')) {
    return NextResponse.json({ code:'ERR_VALIDATION' }, { status: 400 });
  }
  return NextResponse.json({
    id:'u1', name: body.name || 'Gabriel', email: body.email || 'gabriel@example.com', roles:['CLIENT','PROVIDER']
  });
}
