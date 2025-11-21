import { connect } from 'nats';

const g = globalThis;
if (!g.__evt_notif_bus) {
  const { EventEmitter } = require('node:events');
  g.__evt_notif_bus = new EventEmitter();
  g.__evt_notif_bus.setMaxListeners(1000);
}

let client = null;

export async function getNats() {
  if (client) return client;
  try {
    client = await connect({ servers: process.env.NEXT_PUBLIC_NATS_URL || 'nats://localhost:4222' });
    // exemplu: ascultă un topic comun și împinge către bus
    const sub = client.subscribe(process.env.NEXT_PUBLIC_NATS_TOPIC_NOTIF || 'ui.notifications');
    (async () => {
      for await (const m of sub) {
        try {
          const msg = JSON.parse(m.data.toString());
          // msg = { userId, title, time }
          g.__evt_notif_bus.emit('push', msg);
        } catch {}
      }
    })();
  } catch (e) {
    console.error('NATS UI connect failed:', e?.message || e);
  }
  return client;
}
