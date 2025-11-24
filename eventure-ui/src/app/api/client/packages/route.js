// src/app/api/client/packages/route.js
import { NextResponse } from 'next/server';
import { providersFetch } from '@/lib/server/providersProxy';

export async function GET(req) {
  const url = new URL(req.url);
  const qs = url.search; // include ?...
  const upstream = await providersFetch(`/client/packages${qs}`, {
    method: 'GET',
  });

  return new NextResponse(
    upstream.contentType === 'application/json'
      ? JSON.stringify(upstream.body ?? null)
      : upstream.body ?? '',
    {
      status: upstream.status,
      headers: { 'Content-Type': upstream.contentType },
    }
  );
}
