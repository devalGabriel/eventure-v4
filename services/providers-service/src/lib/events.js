// src/lib/events.js
import { getNats } from './nats.js';
import { logger } from './logger.js';

export async function emitDomainEvent (type, payload) {
  try {
    const nc = await getNats();
    const subject = `provider.${type}`;
    const data = JSON.stringify(payload);
    await nc.publish(subject, new TextEncoder().encode(data));
    console.log({ subject, type }, 'Domain event emitted');
  } catch (err) {
    console.log({ err, type }, 'Failed to emit domain event');
  }
}

// Evenimente deja “rezervate” pentru viitor:
// - provider.profile.updated
// - provider.profile.activated
// - provider.service_offer.created
// - provider.package.created
// - provider.availability.changed
