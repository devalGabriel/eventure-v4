// services/events-service/src/routes/events.js
import { prisma } from '../db.js';
import { NotFound, BadRequest } from '../errors.js';

// adapter simplu pt. stilul Fastify reply (unde îl folosești în access services)
function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({ send: (body) => res.status(status).json(body) });
  return f;
}

/**
 * Endpoints acoperite:
 *  GET /events                      -> listare (owner=me | all=true | default: pentru user)
 *  GET /events/:id                  -> detalii (cu acces owner/admin/participant)
 *  POST /events                     -> (există deja la tine; nu îl atingem dacă ai alt fișier)
 *  GET /admin/events/stats          -> statistici simple pt. cardul admin
 */
export async function eventsRoutes(app) {
  // LISTARE
  app.get('/events', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);

    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
    const all = String(req.query.all || '').toLowerCase() === 'true';
    const owner = String(req.query.owner || '').toLowerCase(); // 'me' sau ''

    // ADMIN poate vedea all=true
    if (all) {
      if (user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

      const [rows, total] = await Promise.all([
        prisma.event.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize
        }),
        prisma.event.count()
      ]);

      return reply.send({ rows, total, page, pageSize });
    }

    // owner=me -> necesită autentificare reală
    if (owner === 'me') {
      if (!user?.userId) return res.status(401).json({ error: 'Unauthenticated' });

      const uid = user.userId;

      const where = {
        OR: [
          { clientId: uid }, // evenimente create de mine (client owner)
          { participants: { some: { userId: uid } } } // unde sunt participant
        ]
      };

      const [rows, total] = await Promise.all([
        prisma.event.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize
        }),
        prisma.event.count({ where })
      ]);

      return reply.send({ rows, total, page, pageSize });
    }

    // fallback: dacă nu e all nici owner=me, listăm „pentru user” (autentificat) minimal
    if (!user?.userId) {
      // fără user -> nimic (sau 401, în funcție de UI)
      return res.status(200).json({ rows: [], total: 0, page, pageSize });
    }

    const uid = user.userId;
    const where = {
      OR: [
        { clientId: uid },
        { participants: { some: { userId: uid } } }
      ]
    };

    const [rows, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.event.count({ where })
    ]);

    return reply.send({ rows, total, page, pageSize });
  });

  // DETALII
  app.get('/events/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const e = await prisma.event.findUnique({
      where: { id },
      include: {
        participants: true
      }
    });
    if (!e) throw NotFound('Event not found');

    if (user?.role !== 'admin') {
      const isOwner = e.clientId === user?.userId;
      const isParticipant = e.participants?.some?.(p => p.userId === user?.userId);
      if (!isOwner && !isParticipant) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    return reply.send(e);
  });

  // STATS pentru ADMIN (pt. cardul din dashboard)
  app.get('/admin/events/stats', async (req, res) => {
    console.log('Received request for /admin/events/stats');
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);

    if (user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const now = new Date();
    const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, last30, upcoming] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { createdAt: { gte: past30 } } }),
      prisma.event.count({ where: { date: { gte: now } } }).catch(() => 0) // date poate să nu existe în toate schemele
    ]);

    return reply.send({ total, last30, upcoming });
  });
}
