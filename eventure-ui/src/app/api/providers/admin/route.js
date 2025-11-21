// src/app/api/providers/admin/route.js
import { NextResponse } from 'next/server';
import { providersFetch, forwardProviderResponse } from '@/lib/server/providersProxy';

export async function GET(request) {
  const url = new URL(request.url);
  const search = url.search || '';
  const res = await providersFetch(`/providers${search}`, {
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
