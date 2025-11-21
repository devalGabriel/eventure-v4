import { prisma } from '../db.js';

export async function getEventOrThrow(id) {
  const ev = await prisma.event.findUnique({ where: { id } });
  if (!ev) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }
  return ev;
}

export async function ensureEventOwnerOrAdmin(user, eventId, reply) {
  const ev = await getEventOrThrow(eventId);
  if (user.role === 'admin' || ev.ownerId === user.userId) return ev;
  reply.code(403).send({ error: 'Forbidden' });
  return null;
}

export async function ensureProviderOrAdmin(user, reply) {
  if (user.role === 'admin' || user.role === 'provider') return true;
  reply.code(403).send({ error: 'Provider access required' });
  return false;
}
