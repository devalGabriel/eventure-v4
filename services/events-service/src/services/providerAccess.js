// services/events-service/src/services/providerAccess.js
import { prisma } from '../db.js';
import { isAdminUser, getUserId } from './authz.js';

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
  if (isAdminUser(user)) return true;

  const st = await getProviderState(getUserId(user));
  if (st.approved) return true;

  reply.code(403).send({ error: 'Provider access required (apply/approve first)' });
  return false;
}