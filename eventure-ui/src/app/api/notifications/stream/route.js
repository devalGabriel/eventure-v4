// src/app/api/notifications/stream/route.js
import { NextResponse } from 'next/server';
import { getGlobalBus } from '@/lib/notif-bus'; // vezi snippetul de mai jos

export const runtime = 'nodejs'; // sau 'edge' dacă știi ce faci cu streams pe edge

export async function GET(req) {
  const g = getGlobalBus();
  const { signal } = req; // în App Router, req este Web Request, are signal

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (evt, data) => {
        if (closed) return;
        try {
          controller.enqueue(`event: ${evt}\n`);
          controller.enqueue(`data: ${JSON.stringify(data ?? {})}\n\n`);
        } catch {
          // dacă a închis deja, marchez closed
          closed = true;
        }
      };

      const onPush = (payload) => send('message', payload);
      g.on('push', onPush);

      // heartbeat (25s)
      const ka = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(`event: ping\ndata: {}\n\n`);
        } catch {
          closed = true;
        }
      }, 25_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(ka);
        g.off('push', onPush);
        try { controller.close(); } catch {}
      };

      // dacă clientul închide conexiunea:
      signal.addEventListener('abort', cleanup);
      // fallback de siguranță
      controller._cleanup = cleanup;
    },

    cancel() {
      // chemat dacă stream-ul este anulat explicit
      try { this._controller?._cleanup?.(); } catch {}
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      // IMPORTANT: CORS pt. tab-ui către același host
      'Access-Control-Allow-Origin': '*', // stricten în prod
    },
  });
}
