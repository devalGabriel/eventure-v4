// src/app/api/providers/me/calendar/route.js
import { NextResponse } from 'next/server';
import { providersFetch, forwardProviderResponse } from '@/lib/server/providersProxy';

export async function GET(request) {
  const url = new URL(request.url);
  const search = url.search || '';
  const res = await providersFetch(`/providers/me/calendar${search}`, {
    method: 'GET'
  });
  const { status, body, contentType } = await forwardProviderResponse(res);

  if (contentType === 'application/json') {
    return NextResponse.json(body, { status });
  }
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': contentType }
  });
}

export async function PUT(request) {
  const payload = await request.json();
  const res = await providersFetch('/providers/me/calendar/blocks', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  const { status, body, contentType } = await forwardProviderResponse(res);

  if (contentType === 'application/json') {
    return NextResponse.json(body, { status });
  }
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': contentType }
  });
}
