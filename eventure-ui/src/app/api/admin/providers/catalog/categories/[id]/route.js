// src/app/api/admin/providers/catalog/categories/[id]/route.js
import { providersFetch, forwardProviderResponse } from '@/lib/server/providersProxy';

export async function PUT(request, { params }) {
  const { id } = params;
  const data = await request.json().catch(() => ({}));

  const res = await providersFetch(`/providers/catalog/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

  const { status, body, contentType } = await forwardProviderResponse(res);
  return new Response(
    contentType === 'application/json' ? JSON.stringify(body ?? null) : body ?? '',
    {
      status,
      headers: { 'content-type': contentType || 'application/json' },
    }
  );
}

export async function DELETE(request, { params }) {
  const { id } = params;

  const res = await providersFetch(`/providers/catalog/categories/${id}`, {
    method: 'DELETE',
  });

  const { status, body, contentType } = await forwardProviderResponse(res);
  return new Response(
    contentType === 'application/json' ? JSON.stringify(body ?? null) : body ?? '',
    {
      status,
      headers: { 'content-type': contentType || 'application/json' },
    }
  );
}
