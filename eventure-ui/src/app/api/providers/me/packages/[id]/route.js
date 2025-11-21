// src/app/api/providers/me/packages/[id]/route.js
import { NextResponse } from 'next/server';
import { providersFetch, forwardProviderResponse } from '@/lib/server/providersProxy';

export async function PUT(request, { params }) {
  const { id } = await params;
  const payload = await request.json();

  const res = await providersFetch(`/providers/me/packages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  const { status, body, contentType } = await forwardProviderResponse(res);

  if (contentType === 'application/json') {
    return NextResponse.json(body, { status });
  }

  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': contentType },
  });
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  const res = await providersFetch(`/providers/me/packages/${id}`, {
    method: 'DELETE',
  });

  const { status, body, contentType } = await forwardProviderResponse(res);

  if (contentType === 'application/json') {
    return NextResponse.json(body, { status });
  }

  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': contentType },
  });
}
