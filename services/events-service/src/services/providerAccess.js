// services/events-service/src/services/providerAccess.js
import { prisma } from '../db.js';

export async function getProviderState(userId) {
  const userIdStr = (userId ?? '').toString();
  if (!userIdStr) {
    return {
      hasProfile: false,
      profile: null,
      application: null,
      approved: false,
    };
  }

  const [profile, app] = await Promise.all([
    prisma.providerProfile.findUnique({ where: { userId: userIdStr } }),
    prisma.providerApplication.findUnique({ where: { userId: userIdStr } }),
  ]);

  return {
    hasProfile: !!profile,
    profile,
    application: app,
    approved: !!profile || app?.status === 'APPROVED',
  };
}

// Guard generic: admin sau provider aprobat
export async function ensureProviderAccess(user, reply) {
  // admin are voie oricum
  if (user.role === 'admin') return true;

  const st = await getProviderState(user.userId ?? user.id);
  if (st.approved) return true;

  reply.code(403).send({ error: 'Provider access required (apply/approve first)' });
  return false;
}
