import { NextResponse } from 'next/server';
import { providersFetch, forwardProviderResponse } from '@/lib/server/providersProxy';

export async function PUT(request, { params }) {
  const { id } = params;
  const payload = await request.json();

  const res = await providersFetch(`/providers/me/packages/${id}`, {
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
