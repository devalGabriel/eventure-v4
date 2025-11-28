// services/events-service/src/services/eventsAccess.js
import { prisma } from '../db.js';
import { NotFound } from '../errors.js';

// helper unificat pentru userId (id poate veni ca userId sau id)
function getUserIdFromUser(user) {
  return (
    user?.userId?.toString?.() ||
    user?.id?.toString?.() ||
    ''
  );
}

export async function getEventOrThrow(id) {
  const ev = await prisma.event.findUnique({ where: { id } });
  if (!ev) {
    throw NotFound('Event not found');
  }
  return ev;
}

/**
 * Asigură că user-ul are acces la eveniment:
 *  - admin → full access
 *  - owner (clientId === userId)
 *  - participant în EventParticipant (orice rol)
 *
 *  Dacă nu are acces:
 *   - trimite răspuns 404 dacă event nu există
 *   - trimite 401 dacă nu avem userId în token
 *   - trimite 403 dacă nu este owner/participant/admin
 *
 *  Returnează:
 *   - Event (obiectul) dacă accesul e permis
 *   - null dacă accesul este refuzat (reply deja trimis)
 */
export async function ensureEventOwnerOrAdmin(user, eventId, reply) {
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!ev) {
    reply.code(404).send({ error: 'Event not found' });
    return null;
  }

  // admin → full access
  if (user?.role === 'admin') {
    return ev;
  }

  const userId = getUserIdFromUser(user);
  if (!userId) {
    reply.code(401).send({ error: 'Unauthenticated' });
    return null;
  }

  // owner (clientId)
  if (ev.clientId === userId) {
    return ev;
  }

  // participant (orice rol, nu doar PROVIDER)
  const participant = await prisma.eventParticipant.findFirst({
    where: {
      eventId,
      userId,
    },
  });

  if (participant) {
    return ev;
  }

  // altfel, interzis
  reply.code(403).send({ error: 'Forbidden' });
  return null;
}

/**
 * Verifică dacă user-ul este PROVIDER sau ADMIN
 */
export async function ensureProviderOrAdmin(user, reply) {
  if (user?.role === 'admin' || user?.role === 'provider') return true;
  reply.code(403).send({ error: 'Provider access required' });
  return false;
}
