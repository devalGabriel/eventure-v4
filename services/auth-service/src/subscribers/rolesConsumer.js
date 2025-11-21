// services/auth-service/src/subscribers/rolesConsumer.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * users.role.updated -> reflect rolul în auth DB + revocă refresh tokens (force logout)
 * + emite un notify.generic prietenos
 */
export async function registerRoleConsumer(nats, logger = console) {
  if (!nats) {
    logger.warn('NATS not connected, skipping role consumer');
    return;
  }
  const subj = process.env.NATS_TOPIC_USERS_ROLE_UPDATED || 'users.role.updated';
  const notifyTopic = process.env.NATS_TOPIC_NOTIFY_GENERIC || 'notify.generic';

  const sub = nats.subscribe(subj);
  (async () => {
    for await (const m of sub) {
      try {
        const evt = JSON.parse(m.data.toString());
                const { userId, add = [] } = evt || {};
        if (!userId) continue;

        // normalizăm la UPPERCASE pentru că users-service folosește enum RoleName
        const norm = add.map((r) => String(r).toUpperCase());

        let nextRole = null;
        if (norm.includes('ADMIN')) nextRole = 'admin';
        else if (norm.includes('PROVIDER')) nextRole = 'provider';
        else if (norm.includes('CLIENT')) nextRole = 'client';


        if (nextRole) {
          await prisma.user.update({
            where: { id: Number(userId) || userId },
            data: { role: nextRole }
          }).catch(() => {});
        }

        // revoke refresh tokens => force logout pe toate sesiunile
        await prisma.refreshToken.deleteMany({ where: { userId: Number(userId) || userId } }).catch(() => {});

        // notificare prietenoasă (opțional dar util UX)
        try {
          nats.publish(notifyTopic, Buffer.from(JSON.stringify({
            userId,
            title: 'Session updated',
            body: 'Your permissions changed. Please sign in again.',
            type: 'ROLE_UPDATED'
          })));
        } catch {}

        logger.info({ userId, nextRole }, 'auth-service: role updated & sessions revoked');
      } catch (err) {
        logger.error({ err }, 'auth-service: failed to process users.role.updated');
      }
    }
  })();
}
