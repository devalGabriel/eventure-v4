// services/events-service/src/services/outbox.js
import { prisma } from '../db.js';
import { logger } from '../logger.js';
import { natsPublish } from '../nats.js';

/**
 * Enqueue domain event în outbox.
 *
 * Nu aruncă eroare spre caller – dacă outbox eșuează, fluxul business merge
 * mai departe, iar noi logăm problema.
 */
export async function enqueueDomainEvent({
  aggregateType,
  aggregateId,
  type,
  payload,
  scheduledAt = null,
}) {
  try {
    const record = await prisma.integrationEventOutbox.create({
      data: {
        aggregateType,
        aggregateId,
        type,
        payload,
        scheduledAt: scheduledAt || new Date(),
      },
    });

    // Best-effort publish direct pe NATS (dev / low-risk).
    // Outbox-ul rămâne adevărul principal.
    try {
      await natsPublish(type, {
        ...payload,
        _outboxId: record.id,
        _source: 'events-service',
      });
    } catch (err) {
      logger.warn(
        { err, type, aggregateType, aggregateId },
        'Live NATS publish failed, will rely on outbox worker'
      );
    }

    return record;
  } catch (err) {
    logger.error(
      { err, aggregateType, aggregateId, type },
      'Failed to enqueue domain event'
    );
    // nu aruncăm, lăsăm fluxul business să continue
    return null;
  }
}

/**
 * Procesează un batch de outbox (folosit de worker).
 *
 * returnează numărul de mesaje procesate (0 dacă nu a fost nimic de făcut)
 */
export async function processOutboxBatch(limit = 50) {
  const now = new Date();

  // 1) Luăm câteva mesaje PENDING
  const pending = await prisma.integrationEventOutbox.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  });

  if (!pending.length) return 0;

  let processedCount = 0;

  for (const item of pending) {
    // 2) „claim” safe: încercăm să trecem la PROCESSING doar dacă e încă PENDING
    const claimed = await prisma.integrationEventOutbox.updateMany({
      where: {
        id: item.id,
        status: 'PENDING',
      },
      data: {
        status: 'PROCESSING',
        attempts: { increment: 1 },
        lastError: null,
      },
    });

    if (!claimed.count) {
      // alt worker (sau alt proces) a preluat deja item-ul
      continue;
    }

    try {
      await natsPublish(item.type, {
        ...item.payload,
        _outboxId: item.id,
        _source: 'events-service',
        _attempt: item.attempts + 1,
      });

      await prisma.integrationEventOutbox.update({
        where: { id: item.id },
        data: {
          status: 'SENT',
          lastError: null,
        },
      });

      processedCount += 1;
    } catch (err) {
      logger.error(
        { err, id: item.id, type: item.type },
        'Outbox publish failed'
      );
      await prisma.integrationEventOutbox.update({
        where: { id: item.id },
        data: {
          status: 'FAILED',
          lastError: err?.message?.slice?.(0, 500) || String(err),
        },
      });
    }
  }

  return processedCount;
}
