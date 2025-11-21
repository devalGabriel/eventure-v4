// src/app/api/admin/providers/catalog/categories/route.js
import { providersFetch, forwardProviderResponse } from '@/lib/server/providersProxy';

export async function POST(request) {
  const data = await request.json().catch(() => ({}));

  const res = await providersFetch('/providers/catalog/categories', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

  const { status, body, contentType } = await forwardProviderResponse(res);

  return new Response(
    contentType === 'application/json' ? JSON.stringify(body ?? null) : body ?? '',
    {
      status,
      headers: {
        'content-type': contentType || 'application/json',
      },
    }
  );
}
