module.exports = async function routes(fastify) {
  fastify.get('/stream', { websocket: false }, async (req, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders?.();

    const send = (event, data) => {
      reply.raw.write(`event: ${event}\n`);
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // ping la 15s
    const interval = setInterval(() => send('ping', { t: Date.now() }), 15000);

    // ex: dacă NATS există, te poți abona și retransmite aici
    const sub = fastify.nats?.subscribe?.(process.env.NATS_TOPIC_OUT || 'ui.notifications');
    (async () => {
      if (!sub) return;
      for await (const m of sub) {
        try {
          const data = JSON.parse(m.data?.toString?.() || '{}');
          send('notify', data);
        } catch(e) {}
      }
    })();

    req.raw.on('close', () => {
      clearInterval(interval);
      try { sub?.unsubscribe?.(); } catch {}
      reply.raw.end();
    });

    // welcome
    send('welcome', { ok: true });
    return reply; // stream deschis
  });
};
