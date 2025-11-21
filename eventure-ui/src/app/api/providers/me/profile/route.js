// src/app/api/providers/me/profile/route.js
import { providersFetch, forwardProviderResponse } from '@/lib/server/providersProxy';

export async function GET() {
  const res = await providersFetch('/providers/me/profile', {
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

export async function PUT(request) {
  const data = await request.json().catch(() => ({}));

  const res = await providersFetch('/providers/me/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
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
