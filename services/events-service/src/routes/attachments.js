// services/events-service/src/routes/attachments.js
import express from 'express';
import { prisma } from '../db.js';
import { BadRequest, NotFound } from '../errors.js';

/**
 * Import (named):  import { attachmentsRoutes } from './routes/attachments.js';
 * Mount:           attachmentsRoutes(app);
 *
 * Doar metadata, NU upload binar aici.
 */
export function attachmentsRoutes(app) {
  const router = express.Router();

  // Listă atașamente pentru un eveniment
  router.get('/events/:eventId/attachments', async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const rows = await prisma.eventAttachment.findMany({
        where: { eventId: Number(eventId) },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(rows);
    } catch (err) { next(err); }
  });

  // Creează metadata de atașament
  router.post('/events/:eventId/attachments', async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const { filename, url, mimeType, size } = req.body || {};
      if (!filename || !url) throw BadRequest('filename and url are required');

      const created = await prisma.eventAttachment.create({
        data: {
          eventId: Number(eventId),
          filename,
          url,
          mimeType: mimeType || null,
          size: typeof size === 'number' ? size : null
        }
      });
      return res.status(201).json(created);
    } catch (err) { next(err); }
  });

  // Șterge un atașament după id
  router.delete('/attachments/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const row = await prisma.eventAttachment.findUnique({ where: { id } });
      if (!row) throw NotFound('Attachment not found');
      await prisma.eventAttachment.delete({ where: { id } });
      return res.status(204).send();
    } catch (err) { next(err); }
  });

  app.use(router);
}
