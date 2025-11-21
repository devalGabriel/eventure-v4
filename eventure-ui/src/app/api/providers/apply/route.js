// eventure-ui/src/app/api/providers/apply/route.js
export const dynamic = 'force-dynamic';

function passThroughCookie(req) {
  const c = req.headers.get('cookie') || '';
  return c;
}

const EVENTS_URL = (process.env.EVENTS_INTERNAL_URL || '').replace(/\/$/, '');

export async function POST(req) {
  if (!EVENTS_URL) {
    return new Response(JSON.stringify({ error: 'EVENTS_URL not configured' }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }

  const cookieHeader = passThroughCookie(req);
  const body = await req.json().catch(() => ({}));

  // 1) apply
  const r = await fetch(`${EVENTS_URL}/providers/apply`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  // dacă eșuează, proxy direct
  if (!r.ok) {
    const text = await r.text();
    return new Response(text || '{}', { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json' } });
  }

  // 2) imediat după, citim state curent
  const me = await fetch(`${EVENTS_URL}/providers/me`, {
    method: 'GET',
    headers: { Accept: 'application/json', Cookie: cookieHeader },
    cache: 'no-store'
  }).then(x => x.json()).catch(() => ({}));

  return new Response(JSON.stringify({ ok: true, state: me }), {
    status: 200, headers: { 'content-type': 'application/json' }
  });
}
