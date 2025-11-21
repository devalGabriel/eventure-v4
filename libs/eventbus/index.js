import { connect } from 'nats';

export async function initEventBus(opts = {}) {
  const url = opts.url || process.env.NATS_URL || 'nats://localhost:4222';
  const clientId = opts.clientId || process.env.NATS_CLIENT_ID || 'auth-svc';
  const nc = await connect({ servers: url, name: clientId });
  return nc;
}

export async function publishEvent(nc, topic, payload) {
  if (!nc) throw new Error('NATS connection missing');
  if (!topic) throw new Error('Topic is required');
  return nc.publish(topic, Buffer.from(JSON.stringify(payload)));
}

// alias convenabil
export const publish = publishEvent;

export function subscribeEvent(nc, topic, handler) {
  const sub = nc.subscribe(topic);
  (async () => {
    for await (const m of sub) {
      handler(JSON.parse(m.data.toString()));
    }
  })();
  return sub;
}
