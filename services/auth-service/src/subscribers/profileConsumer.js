// services/auth-service/src/subscribers/profileConsumer.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * users.profile.updated -> sincronizează email / name în auth DB
 */
export async function registerProfileConsumer(nats, logger = console) {
  if (!nats) {
    logger.warn('NATS not connected, skipping profile consumer');
    return;
  }

  const subj = process.env.NATS_TOPIC_USERS_PROFILE_UPDATED || 'users.profile.updated';
  const sub = nats.subscribe(subj);

  (async () => {
    for await (const m of sub) {
      try {
        const evt = JSON.parse(m.data.toString());
        const { authUserId, email, fullName } = evt || {};
        if (!authUserId) continue;

        const userId = Number(authUserId) || authUserId;

        const data = {};
        if (typeof email === 'string' && email.trim()) {
          data.email = email.trim();
        }
        if (typeof fullName === 'string' && fullName.trim()) {
          data.name = fullName.trim();
        }

        if (!Object.keys(data).length) continue;

        await prisma.user.update({
          where: { id: userId },
          data,
        }).catch(() => {});

        logger.info({ userId, changed: Object.keys(data) }, 'auth-service: profile updated from users-service');
      } catch (err) {
        logger.error({ err }, 'auth-service: failed to process users.profile.updated');
      }
    }
  })();
}
