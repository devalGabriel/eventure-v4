// src/app/api/providers/catalog/route.js
import { providersFetch, forwardProviderResponse } from '@/lib/server/providersProxy';

export async function GET() {
  const res = await providersFetch('/providers/catalog/categories', {
    method: 'GET',
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
