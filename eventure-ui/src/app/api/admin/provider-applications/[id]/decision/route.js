// eventure-ui/src/app/api/admin/provider-applications/[id]/decision/route.js
export const dynamic = 'force-dynamic';

function passThroughCookie(req) {
  return req.headers.get('cookie') || '';
}

async function forward(request, { params }) {
  const p = await params
  const base = process.env.EVENTS_INTERNAL_URL?.replace(/\/$/, '');
  if (!base) {
    return new Response(JSON.stringify({ error: 'EVENTS_INTERNAL_URL not configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const cookieHeader = passThroughCookie(request);
  const body = await request.json().catch(() => ({}));

  const res = await fetch(`${base}/admin/provider-applications/${p.id}/decision`, {
    method: 'POST',                            // backend folosește POST
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const text = await res.text().catch(() => '');
  return new Response(text || '{}', {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') || 'application/json',
    },
  });
}

export async function POST(request, ctx) {
  return forward(request, ctx);
}

export async function PATCH(request, ctx) {
  // PATCH din UI -> POST către events-service
  return forward(request, ctx);
}
