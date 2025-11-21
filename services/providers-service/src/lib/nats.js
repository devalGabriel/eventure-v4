// src/lib/nats.js
import { connect } from 'nats';
import { logger } from './logger.js';

let nc;

export async function getNats () {
  if (nc) return nc;
  const url = process.env.NATS_URL || 'nats://localhost:4222';
  nc = await connect({ servers: url });
  logger.info({ url }, 'Connected to NATS');
  return nc;
}
