// services/events-service/src/workers/outboxWorker.js
import 'dotenv/config';
import { ENV } from '../env.js';
import { logger } from '../logger.js';
import { processOutboxBatch } from '../services/outbox.js';
import { natsConnect } from '../nats.js';
import { prisma } from '../db.js';

const INTERVAL_MS =
  Number(process.env.OUTBOX_INTERVAL_MS || '2000'); // 2s default
const BATCH_LIMIT =
  Number(process.env.OUTBOX_BATCH_LIMIT || '50');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  logger.info(
    {
      intervalMs: INTERVAL_MS,
      batchLimit: BATCH_LIMIT,
    },
    'events-service outbox worker starting'
  );

  // ne asigurăm că avem conexiune NATS
  await natsConnect();

  // buclă simplă
  // (în prod poți pune și un mecanism de stop graceful)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const processed = await processOutboxBatch(BATCH_LIMIT);

      if (processed === 0) {
        // nimic de procesat – facem un sleep mai lung
        await sleep(INTERVAL_MS);
      } else {
        // am avut treabă – mai verificăm imediat, fără pauză mare
        // totuși, un mic sleep să nu blocăm CPU-ul
        await sleep(100);
      }
    } catch (err) {
      logger.error({ err }, 'Outbox worker loop error');
      // în caz de eroare globală, dormim un pic mai mult
      await sleep(INTERVAL_MS * 2);
    }
  }
}

// rulează doar dacă nu suntem în test
if (ENV.NODE_ENV !== 'test') {
  main()
    .catch((err) => {
      logger.error({ err }, 'Outbox worker failed fatally');
      process.exit(1);
    });
}
