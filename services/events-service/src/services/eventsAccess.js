import { prisma } from '../db.js';
import { NotFound } from '../errors.js';

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
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!ev) {
    throw NotFound('Event not found');
  }

  // Admin poate tot
  if (user?.role === 'admin') return ev;

  const userId = String(user?.userId ?? user?.id ?? '');
  if (!userId) {
    reply.code(401).send({ error: 'Unauthenticated' });
    return null;
  }

  // Owner (client)
  if (ev.clientId === userId) {
    return ev;
  }

  // Participant (provider/client secundar etc.)
  const participant = await prisma.eventParticipant.findFirst({
    where: {
      eventId,
      userId,
    },
  });

  if (participant) {
    return ev;
  }

  reply.code(403).send({ error: 'Forbidden' });
  return null;
}

export async function ensureProviderOrAdmin(user, reply) {
  if (user.role === 'admin' || user.role === 'provider') return true;
  reply.code(403).send({ error: 'Provider access required' });
  return false;
}
