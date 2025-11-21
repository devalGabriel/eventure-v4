// services/auth-service/src/subscribers/profileConsumer.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * users.profile.updated -> sincronizează nume/email în auth DB
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
        const {
          authUserId,
          userId,     // UUID profil (fallback)
          email,
          fullName
        } = evt || {};

        const where = authUserId
          ? { id: Number(authUserId) || authUserId }
          : userId
            ? { id: Number(userId) || userId }
            : null;

        if (!where) continue;

        const data = {};
        if (typeof email === 'string' && email.length) data.email = email;
        if (typeof fullName === 'string' && fullName.length) data.name = fullName;

        if (!Object.keys(data).length) continue;

        await prisma.user.update({ where, data }).catch(() => {});

        logger.info(
          { where, changed: Object.keys(data) },
          'auth-service: user profile updated from users-service'
        );
      } catch (err) {
        logger.error({ err }, 'auth-service: failed to process users.profile.updated');
      }
    }
  })();
}
