import { NextResponse } from 'next/server';
import { providersFetch, forwardProviderResponse } from '@/lib/server/providersProxy';

export async function POST(request) {
  const payload = await request.json();
  const res = await providersFetch('/providers/admin/catalog/subcategories', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const { status, body, contentType } = await forwardProviderResponse(res);
  if (contentType === 'application/json') {
    return NextResponse.json(body, { status });
  }
  return new NextResponse(body, { status, headers: { 'Content-Type': contentType } });
}
