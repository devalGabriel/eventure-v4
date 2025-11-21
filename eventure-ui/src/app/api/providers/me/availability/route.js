import { NextResponse } from 'next/server';
import { providersFetch, forwardProviderResponse } from '@/lib/server/providersProxy';

export async function GET() {
  const res = await providersFetch('/providers/me/availability', {
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
  const res = await providersFetch('/providers/me/availability', {
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
