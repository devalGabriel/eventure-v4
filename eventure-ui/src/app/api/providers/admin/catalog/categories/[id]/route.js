import { NextResponse } from 'next/server';
import { providersFetch, forwardProviderResponse } from '@/lib/server/providersProxy';

export async function PUT(request, { params }) {
  const payload = await request.json();
  const res = await providersFetch(`/providers/admin/catalog/categories/${params.id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  const { status, body, contentType } = await forwardProviderResponse(res);
  if (contentType === 'application/json') {
    return NextResponse.json(body, { status });
  }
  return new NextResponse(body, { status, headers: { 'Content-Type': contentType } });
}

export async function DELETE(_request, { params }) {
  const res = await providersFetch(`/providers/admin/catalog/categories/${params.id}`, {
    method: 'DELETE'
  });
  const { status, body, contentType } = await forwardProviderResponse(res);
  if (contentType === 'application/json') {
    return NextResponse.json(body, { status });
  }
  return new NextResponse(body, { status, headers: { 'Content-Type': contentType } });
}
