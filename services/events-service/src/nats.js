import { connect } from 'nats';
import { ENV } from './env.js';
import { logger } from './logger.js';

let nc;

export async function natsConnect() {
  if (nc) return nc;
  const opts = { servers: ENV.NATS_URL };
  if (ENV.NATS_USER) opts.user = ENV.NATS_USER;
  if (ENV.NATS_PASS) opts.pass = ENV.NATS_PASS;
  nc = await connect(opts);
  logger.info({ url: ENV.NATS_URL }, 'NATS connected');
  return nc;
}

export async function natsPublish(subject, data) {
  try {
    const conn = await natsConnect();
    const full = `${ENV.NATS_PREFIX}.${subject}`;
    conn.publish(full, Buffer.from(JSON.stringify(data)));
  } catch (e) {
    logger.error(e, 'NATS publish failed');
  }
}
