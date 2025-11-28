// services/events-service/src/routes/messages.js
import express from 'express';
import { prisma } from '../db.js';
import { BadRequest, NotFound } from '../errors.js';
import { sendNotification } from '../services/notificationsClient.js';

/**
 * Helper: extrage authUserId din structura user-ului venit din app.verifyAuth.
 * Acceptă:
 *  - user.userId (preferat)
 *  - user.id
 *  - user.authUserId
 */
function getAuthUserId(user) {
  if (!user) return '';
  return String(user.userId ?? user.id ?? user.authUserId ?? '');
}

/**
 * Verifică dacă utilizatorul are acces la un eveniment (mesaje).
 * Permitem:
 *  - admin
 *  - client owner (event.clientId)
 *  - participanți (EventParticipant.userId)
 *  - provideri cu ofertă sau assignment pe eveniment
 */
async function ensureEventAccessOrThrow(user, eventId) {
  const authUserId = getAuthUserId(user);
  if (!authUserId) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }

  const ev = await prisma.event.findUnique({
    where: { id: eventId },
  });
  if (!ev) {
    throw NotFound('Event not found');
  }

  // admin vede tot
  if (user.role === 'admin') return ev;

  // client owner
  if (ev.clientId === authUserId) return ev;

  // participant direct
  const participant = await prisma.eventParticipant.findFirst({
    where: { eventId, userId: authUserId },
  });
  if (participant) return ev;

  // provider cu ofertă
  const offer = await prisma.eventOffer.findFirst({
    where: { eventId, providerId: authUserId },
  });
  if (offer) return ev;

  // provider cu assignment
  const assignment = await prisma.eventProviderAssignment.findFirst({
    where: { eventId, providerId: authUserId },
  });
  if (assignment) return ev;

  const err = new Error('Forbidden');
  err.statusCode = 403;
  throw err;
}

/**
 * Calculează destinatarii unei notificări pentru mesaj general de eveniment.
 * - client owner
 * - toți participanții (EventParticipant)
 * - excludem autorul
 */
async function computeEventMessageRecipients(eventId, authorId) {
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    select: { clientId: true },
  });
  if (!ev) return [];

  const participants = await prisma.eventParticipant.findMany({
    where: { eventId },
    select: { userId: true },
  });

  const ids = new Set();
  if (ev.clientId) ids.add(String(ev.clientId));
  for (const p of participants) {
    if (p.userId) ids.add(String(p.userId));
  }

  if (authorId) ids.delete(String(authorId));

  return Array.from(ids);
}

/**
 * Destinatari pentru mesaje pe ofertă:
 *  - client owner (event.clientId)
 *  - provider ofertant (offer.providerId)
 *  - excludem autorul
 */
async function computeOfferMessageRecipients(offer, authorId) {
  if (!offer) return [];
  const event = await prisma.event.findUnique({
    where: { id: offer.eventId },
    select: { clientId: true },
  });

  const ids = new Set();
  if (event?.clientId) ids.add(String(event.clientId));
  if (offer.providerId) ids.add(String(offer.providerId));

  if (authorId) ids.delete(String(authorId));

  return Array.from(ids);
}

/**
 * Montează rutele pentru mesaje de eveniment.
 * Import (named):  import { messagesRoutes } from './routes/messages.js';
 * Mount:           messagesRoutes(app);
 */
export function messagesRoutes(app) {
  const router = express.Router();

  // GET: lista mesaje dintr-un eveniment
  router.get('/events/:eventId/messages', async (req, res, next) => {
    try {
      const user = await app.verifyAuth(req);
      const { eventId } = req.params;

      await ensureEventAccessOrThrow(user, eventId);

      const messages = await prisma.eventMessage.findMany({
        where: { eventId },
        orderBy: { createdAt: 'asc' },
      });

      return res.json(messages);
    } catch (err) {
      next(err);
    }
  });

  // POST: creează mesaj pe eveniment (thread general)
  router.post('/events/:eventId/messages', async (req, res, next) => {
    try {
      const user = await app.verifyAuth(req);
      const { eventId } = req.params;
      const { body } = req.body || {};

      if (!body || typeof body !== 'string' || !body.trim()) {
        throw BadRequest('Message body is required');
      }

      const ev = await ensureEventAccessOrThrow(user, eventId);
      const authorId = getAuthUserId(user);

      const created = await prisma.eventMessage.create({
        data: {
          eventId,
          offerId: null,
          authorId,
          body: body.trim(),
        },
      });

      // notificăm ceilalți participanți
      const recipients = await computeEventMessageRecipients(eventId, authorId);
      const snippet =
        body.length > 140 ? `${body.slice(0, 137).trim()}…` : body.trim();

      await Promise.all(
        recipients.map((userId) =>
          sendNotification({
            userId,
            type: 'EVENT_MESSAGE',
            title: `Mesaj nou la eveniment: ${ev.name || ''}`.trim(),
            body: snippet,
            meta: {
              eventId,
              offerId: null,
              messageId: created.id,
            },
          }),
        ),
      );

      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  // GET: lista mesaje dintr-o ofertă
  router.get('/offers/:offerId/messages', async (req, res, next) => {
    try {
      const user = await app.verifyAuth(req);
      const { offerId } = req.params;

      const offer = await prisma.eventOffer.findUnique({
        where: { id: offerId },
      });
      if (!offer) throw NotFound('Offer not found');

      // verificăm accesul la evenimentul ofertei
      await ensureEventAccessOrThrow(user, offer.eventId);

      const messages = await prisma.eventMessage.findMany({
        where: { eventId: offer.eventId, offerId },
        orderBy: { createdAt: 'asc' },
      });

      return res.json(messages);
    } catch (err) {
      next(err);
    }
  });

  // POST: mesaj nou pe thread-ul unei oferte
  router.post('/offers/:offerId/messages', async (req, res, next) => {
    try {
      const user = await app.verifyAuth(req);
      const { offerId } = req.params;
      const { body } = req.body || {};

      if (!body || typeof body !== 'string' || !body.trim()) {
        throw BadRequest('Message body is required');
      }

      const offer = await prisma.eventOffer.findUnique({
        where: { id: offerId },
      });
      if (!offer) throw NotFound('Offer not found');

      const ev = await ensureEventAccessOrThrow(user, offer.eventId);
      const authorId = getAuthUserId(user);

      const created = await prisma.eventMessage.create({
        data: {
          eventId: offer.eventId,
          offerId,
          authorId,
          body: body.trim(),
        },
      });

      const recipients = await computeOfferMessageRecipients(offer, authorId);
      const snippet =
        body.length > 140 ? `${body.slice(0, 137).trim()}…` : body.trim();

      await Promise.all(
        recipients.map((userId) =>
          sendNotification({
            userId,
            type: 'EVENT_MESSAGE',
            title: `Mesaj nou la oferta pentru: ${ev.name || ''}`.trim(),
            body: snippet,
            meta: {
              eventId: offer.eventId,
              offerId,
              messageId: created.id,
            },
          }),
        ),
      );

      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  // DELETE: ștergere mesaj (doar admin sau autor)
  router.delete('/messages/:id', async (req, res, next) => {
    try {
      const user = await app.verifyAuth(req);
      const { id } = req.params;
      const authUserId = getAuthUserId(user);

      const msg = await prisma.eventMessage.findUnique({
        where: { id },
      });
      if (!msg) throw NotFound('Message not found');

      const ev = await prisma.event.findUnique({
        where: { id: msg.eventId },
      });
      if (!ev) throw NotFound('Event not found');

      // doar autorul sau admin-ul pot șterge
      if (user.role !== 'admin' && msg.authorId !== authUserId) {
        const err = new Error('Forbidden');
        err.statusCode = 403;
        throw err;
      }

      await prisma.eventMessage.delete({ where: { id } });

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  app.use(router);
}
