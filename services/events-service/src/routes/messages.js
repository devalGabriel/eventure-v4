// services/events-service/src/routes/messages.js
import express from 'express';
import { prisma } from '../db.js';
import { BadRequest, NotFound } from '../errors.js';

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
    const eventId = req.params.eventId;
    const msgs = await prisma.eventMessage.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(msgs); // array simplu
  } catch (err) {
    next(err);
  }
});

  // POST: adaugă un mesaj nou
  router.post('/events/:eventId/messages', async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const { userId, content } = req.body || {};
      if (!userId || !content) throw BadRequest('Missing userId or content');

      const msg = await prisma.eventMessage.create({
        data: { eventId: Number(eventId), userId, content }
      });
      return res.status(201).json(msg);
    } catch (err) { next(err); }
  });

  // DELETE: șterge un mesaj după id
  router.delete('/messages/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const msg = await prisma.eventMessage.findUnique({ where: { id } });
      if (!msg) throw NotFound('Message not found');
      await prisma.eventMessage.delete({ where: { id } });
      return res.status(204).send();
    } catch (err) { next(err); }
  });

  router.get('/offers/:offerId/messages', async (req, res, next) => {
    try {
      const user = await app.verifyAuth(req);
      const { offerId } = req.params;

      const offer = await prisma.eventOffer.findUnique({ where: { id: offerId } });
      if (!offer) throw NotFound('Offer not found');

      // permisiuni: admin OR client owner eveniment OR provider autor ofertă
      if (user.role !== 'admin') {
        if (user.role === 'provider') {
          if (offer.providerId !== user.userId?.toString()) {
            return res.status(403).json({ error: 'Forbidden' });
          }
        } else {
          const ev = await prisma.event.findUnique({ where: { id: offer.eventId } });
          if (!ev) throw NotFound('Event not found');
          if (ev.clientId !== user.userId?.toString()) {
            return res.status(403).json({ error: 'Forbidden' });
          }
        }
      }

      const messages = await prisma.eventMessage.findMany({
        where: {
          eventId: offer.eventId,
          offerId,
        },
        orderBy: { createdAt: 'asc' },
      });

      return res.json(messages);
    } catch (err) {
      next(err);
    }
  });

  // --- OFFER MESSAGES: POST /offers/:offerId/messages ---
  router.post('/offers/:offerId/messages', async (req, res, next) => {
    try {
      const user = await app.verifyAuth(req);
      const { offerId } = req.params;
      const { body } = req.body || {};

      if (!body || !String(body).trim()) {
        throw BadRequest('body is required');
      }

      const offer = await prisma.eventOffer.findUnique({ where: { id: offerId } });
      if (!offer) throw NotFound('Offer not found');

      // permisiuni: aceleași ca la GET
      if (user.role !== 'admin') {
        if (user.role === 'provider') {
          if (offer.providerId !== user.userId?.toString()) {
            return res.status(403).json({ error: 'Forbidden' });
          }
        } else {
          const ev = await prisma.event.findUnique({ where: { id: offer.eventId } });
          if (!ev) throw NotFound('Event not found');
          if (ev.clientId !== user.userId?.toString()) {
            return res.status(403).json({ error: 'Forbidden' });
          }
        }
      }

      const created = await prisma.eventMessage.create({
        data: {
          eventId: offer.eventId,
          offerId,
          authorId: user.userId?.toString() || '',
          body: String(body),
        },
      });

      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  app.use(router);
}
