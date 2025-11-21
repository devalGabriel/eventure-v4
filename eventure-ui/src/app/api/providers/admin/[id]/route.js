// src/app/api/providers/admin/[id]/route.js
import { NextResponse } from 'next/server';
import { providersFetch, forwardProviderResponse } from '@/lib/server/providersProxy';

export async function GET(_request, { params }) {
  const p = await params
  const { id } = p;
  const res = await providersFetch(`/providers/${id}`, {
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

export async function PATCH(request, { params }) {
  const p = await params
  const { id } = p;
  const payload = await request.json();

  const res = await providersFetch(`/providers/${id}`, {
    method: 'PATCH',
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
