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
      const { eventId } = req.params;
      const messages = await prisma.eventMessage.findMany({
        where: { eventId: Number(eventId) },
        orderBy: { createdAt: 'asc' }
      });
      return res.json(messages);
    } catch (err) { next(err); }
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

  app.use(router);
}
