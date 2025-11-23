// services/events-service/src/routes/events.js
import { prisma } from '../db.js';
import { NotFound, BadRequest } from '../errors.js';
import { ensureEventOwnerOrAdmin } from '../services/eventsAccess.js';

// enum aflat în prisma: DRAFT, PLANNING, ACTIVE, COMPLETED, CANCELED
const STATUS_TRANSITIONS = {
  DRAFT:    ['DRAFT', 'PLANNING', 'CANCELED'],
  PLANNING: ['PLANNING', 'ACTIVE', 'CANCELED'],
  ACTIVE:   ['ACTIVE', 'COMPLETED', 'CANCELED'],
  COMPLETED:['COMPLETED'],
  CANCELED: ['CANCELED'],
};

function getAllowedStatuses(current) {
  return STATUS_TRANSITIONS[current] || [current];
}

// adapter simplu pt. stilul Fastify reply (unde îl folosești în access services)
function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({
    send: (body) => {
      if (status === 204 || status === 304) {
        return res.status(status).end();
      }
      return res.status(status).json(body ?? null);
    },
  });
  return f;
}


export async function eventsRoutes(app) {
  app.post('/events', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);

    const userId = String(user?.userId ?? user?.id ?? '');
    if (!userId) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const {
      name,
      type,
      date,
      location,
      notes,
      budgetPlanned,
      currency,
    } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!type || !String(type).trim()) {
      return res.status(400).json({ error: 'Type is required' });
    }

    let parsedDate = null;
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) parsedDate = d;
    }

    let parsedBudget = null;
    if (typeof budgetPlanned === 'number') {
      parsedBudget = budgetPlanned;
    } else if (
      typeof budgetPlanned === 'string' &&
      budgetPlanned.trim() !== ''
    ) {
      const n = Number(budgetPlanned);
      if (!Number.isNaN(n)) parsedBudget = n;
    }

    try {
      const ev = await prisma.event.create({
        data: {
          clientId: userId,
          name: String(name).trim(),
          type: String(type).trim(),
          date: parsedDate,
          location: location || null,
          notes: notes || null,
          currency: currency || undefined, // lasă default RON dacă nu vine nimic
          budgetPlanned:
            parsedBudget != null ? parsedBudget : undefined,
          status: 'DRAFT',
        },
      });

      return reply.code(201).send(ev);
    } catch (e) {
      console.error('Error creating event', e);
      return res
        .status(500)
        .json({ error: 'Failed to create event' });
    }
  });

    // --- TASKS: POST /events/:id/tasks ---
  app.post('/events/:id/tasks', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!ev) return;

    const { title, dueDate } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Titlul taskului este obligatoriu.' });
    }

    let due = null;
    if (dueDate) {
      const d = new Date(dueDate);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ error: 'Format invalid pentru `dueDate`.' });
      }
      due = d;
    }

    const created = await prisma.eventTask.create({
      data: {
        eventId: id,
        title: String(title).trim(),
        dueDate: due,
      },
    });

    return reply.code(201).send(created);
  });

    // --- TASKS: POST /events/:id/tasks/generate ---
  app.post('/events/:id/tasks/generate', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!ev) return;

    const template = await prisma.eventTypeTemplate.findFirst({
      where: { type: ev.type },
    });

    if (!template) {
      return res.status(404).json({
        error: 'Nu există șablon de taskuri pentru acest tip de eveniment.',
      });
    }

    const tasksDef = Array.isArray(template.taskJson)
      ? template.taskJson
      : [];

    const now = new Date();
    const eventDate = ev.date ? new Date(ev.date) : null;

    const toCreate = tasksDef
      .map((t, idx) => {
        const rawTitle = t?.title ?? '';
        const title = String(rawTitle).trim();
        if (!title) return null;

        let dueDate = null;

        // dacă avem dată eveniment + daysBefore în șablon, calculăm dueDate
        if (eventDate && typeof t.daysBefore === 'number') {
          const d = new Date(eventDate);
          d.setDate(d.getDate() - t.daysBefore);
          dueDate = d;
        } else if (eventDate && typeof t.offsetDays === 'number') {
          const d = new Date(eventDate);
          d.setDate(d.getDate() + t.offsetDays);
          dueDate = d;
        } else if (!eventDate) {
          // fallback: fără dată eveniment -> fără dueDate
          dueDate = null;
        }

        return {
          eventId: id,
          title,
          dueDate,
          status: 'TODO',
          createdAt: now,
          updatedAt: now,
        };
      })
      .filter(Boolean);

    if (!toCreate.length) {
      return res.status(400).json({
        error: 'Șablonul de taskuri nu conține intrări valide.',
      });
    }

    await prisma.eventTask.createMany({
      data: toCreate,
    });

    const tasks = await prisma.eventTask.findMany({
      where: { eventId: id },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });

    return reply.send(tasks);
  });

    // --- EVENT PROGRAM: POST /events/:id/programs ---
  app.post('/events/:id/programs', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!ev) return;

    const { title, startsAt, endsAt, note } = req.body || {};

    if (!title || !String(title).trim()) {
      return res
        .status(400)
        .json({ error: 'Titlul programului este obligatoriu.' });
    }

    if (!startsAt) {
      return res
        .status(400)
        .json({ error: '`startsAt` este obligatoriu (ISO string).' });
    }

    const startDate = new Date(startsAt);
    if (Number.isNaN(startDate.getTime())) {
      return res
        .status(400)
        .json({ error: 'Format invalid pentru `startsAt`.' });
    }

    let endDate = null;
    if (endsAt) {
      const d = new Date(endsAt);
      if (Number.isNaN(d.getTime())) {
        return res
          .status(400)
          .json({ error: 'Format invalid pentru `endsAt`.' });
      }
      endDate = d;
    }

    const created = await prisma.eventProgram.create({
      data: {
        eventId: id,
        title: String(title).trim(),
        startsAt: startDate,
        endsAt: endDate,
        note: note || null,
      },
    });

    return reply.code(201).send(created);
  });

  // LISTARE
  app.get('/events', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const userId = (user?.userId ?? user?.id ?? '').toString() || null;

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
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' });
      }

      const where = {
        OR: [
          { clientId: userId },                    // evenimente create de mine (client owner)
          { participants: { some: { userId } } }   // unde sunt participant
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
    if (!userId) {
      // fără user -> nimic (sau 401, în funcție de UI)
      return res.status(200).json({ rows: [], total: 0, page, pageSize });
    }

    const where = {
      OR: [
        { clientId: userId },
        { participants: { some: { userId } } }
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
        participants: true,
      },
    });

    if (!e) throw NotFound('Event not found');

    if (user?.role !== 'admin') {
      const userId = String(user?.userId ?? user?.id ?? '');
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' });
      }

      const isOwner = e.clientId === userId;
      const isParticipant = e.participants?.some?.(
        (p) => p.userId === userId
      );

      if (!isOwner && !isParticipant) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    return reply.send(e);
  });


    // returnează statusul curent + lista de statusuri permise
  app.get('/events/:id/status', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!ev) return; // ensureEventOwnerOrAdmin a răspuns deja (403 sau 404)

    const allowed = getAllowedStatuses(ev.status);

    return reply.send({
      current: ev.status,
      allowed,
    });
  });

    // --- TASKS: GET /events/:id/tasks ---
  app.get('/events/:id/tasks', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!ev) return;

    const tasks = await prisma.eventTask.findMany({
      where: { eventId: id },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return reply.send(tasks);
  });

    // --- EVENT PROGRAM: GET /events/:id/programs ---
  app.get('/events/:id/programs', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!ev) return;

    const programs = await prisma.eventProgram.findMany({
      where: { eventId: id },
      orderBy: { startsAt: 'asc' },
    });

    return reply.send(programs);
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

    // --- NEEDS: GET /events/:id/needs ---
  app.get('/events/:id/needs', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!ev) return;

    const needs = await prisma.eventNeed.findMany({
      where: { eventId: id },
      orderBy: { createdAt: 'asc' },
    });

    return reply.send(needs);
  });


    // --- BRIEF: GET /events/:id/brief ---
  app.get('/events/:id/brief', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!ev) return;

    const brief = {
      name: ev.name,
      type: ev.type,
      date: ev.date,
      location: ev.location,
      city: ev.city,
      locationType: ev.locationType,
      style: ev.style,
      guestCount: ev.guestCount,
      notes: ev.notes,
      budgetPlanned: ev.budgetPlanned,
      currency: ev.currency,
    };

    return reply.send(brief);
  });

    // --- BRIEF: PUT /events/:id/brief ---
  app.put('/events/:id/brief', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const existing = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!existing) return;

    const {
      guestCount,
      city,
      style,
      locationType,
      notes,
      budgetPlanned,
      currency,
    } = req.body || {};

    const data = {};

    if (guestCount !== undefined) {
      if (guestCount === null || guestCount === '') {
        data.guestCount = null;
      } else {
        const n = Number(guestCount);
        if (Number.isNaN(n) || n < 0) {
          return res
            .status(400)
            .json({ error: 'Invalid value for `guestCount`' });
        }
        data.guestCount = Math.round(n);
      }
    }

    if (city !== undefined) {
      data.city = city ? String(city) : null;
    }

    if (style !== undefined) {
      data.style = style ? String(style) : null;
    }

    if (locationType !== undefined) {
      data.locationType = locationType ? String(locationType) : null;
    }

    if (notes !== undefined) {
      data.notes = notes || null;
    }

    if (currency !== undefined) {
      data.currency = currency || 'RON';
    }

    if (budgetPlanned !== undefined) {
      if (budgetPlanned === null || budgetPlanned === '') {
        data.budgetPlanned = null;
      } else {
        const n = Number(budgetPlanned);
        if (Number.isNaN(n)) {
          return res
            .status(400)
            .json({ error: 'Invalid number for `budgetPlanned`' });
        }
        data.budgetPlanned = n;
      }
    }

    const updated = await prisma.event.update({
      where: { id },
      data,
    });

    return reply.send({
      guestCount: updated.guestCount,
      city: updated.city,
      style: updated.style,
      locationType: updated.locationType,
      notes: updated.notes,
      budgetPlanned: updated.budgetPlanned,
      currency: updated.currency,
    });
  });

    // --- NEEDS: PUT /events/:id/needs ---
  app.put('/events/:id/needs', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!ev) return;

    const { needs } = req.body || {};
    if (!Array.isArray(needs)) {
      return res
        .status(400)
        .json({ error: '`needs` must be an array' });
    }

    const cleanNeeds = needs
      .map((n) => {
        const label = (n.label || '').trim();
        if (!label) return null;

        let budget = null;
        if (n.budgetPlanned !== undefined && n.budgetPlanned !== null && n.budgetPlanned !== '') {
          const b = Number(n.budgetPlanned);
          if (!Number.isNaN(b)) budget = b;
        }

        return {
          eventId: id,
          label,
          budgetPlanned: budget,
          // pregătit pentru 02.4-B5 (integrare cu catalog)
          categoryId: n.categoryId ?? null,
          subcategoryId: n.subcategoryId ?? null,
          tagId: n.tagId ?? null,
        };
      })
      .filter(Boolean);

    await prisma.$transaction([
      prisma.eventNeed.deleteMany({ where: { eventId: id } }),
      ...(cleanNeeds.length
        ? [prisma.eventNeed.createMany({ data: cleanNeeds })]
        : []),
    ]);

    const latest = await prisma.eventNeed.findMany({
      where: { eventId: id },
      orderBy: { createdAt: 'asc' },
    });

    return reply.send(latest);
  });

    app.patch('/events/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const existing = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!existing) return;

    const {
      name,
      location,
      date,
      status,
      notes,
      budgetPlanned,
      currency,
    } = req.body || {};

    const data = {};

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      data.name = trimmed;
    }

    if (location !== undefined) {
      data.location = location ? String(location) : null;
    }

    if (date !== undefined) {
      if (date === null) {
        data.date = null;
      } else {
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) {
          return res
            .status(400)
            .json({ error: 'Invalid date format for `date`' });
        }
        data.date = d;
      }
    }

    if (notes !== undefined) {
      data.notes = notes || null;
    }

    if (currency !== undefined) {
      data.currency = currency || 'RON';
    }

    if (budgetPlanned !== undefined) {
      if (budgetPlanned === null || budgetPlanned === '') {
        data.budgetPlanned = null;
      } else {
        const n = Number(budgetPlanned);
        if (Number.isNaN(n)) {
          return res
            .status(400)
            .json({ error: 'Invalid number for `budgetPlanned`' });
        }
        data.budgetPlanned = n;
      }
    }

    if (status !== undefined) {
      const nextStatus = String(status);
      const allowed = getAllowedStatuses(existing.status);

      if (!allowed.includes(nextStatus)) {
        return res.status(400).json({
          error: 'Invalid status transition',
          from: existing.status,
          to: nextStatus,
          allowed,
        });
      }

      data.status = nextStatus;
    }

    const updated = await prisma.event.update({
      where: { id },
      data,
    });

    return reply.send(updated);
  });

  // --- EVENT PROGRAM: DELETE /programs/:programId ---
  app.delete('/programs/:programId', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { programId } = req.params;

    const program = await prisma.eventProgram.findUnique({
      where: { id: programId },
    });

    if (!program) {
      return res.status(404).json({ error: 'Program slot not found' });
    }

    // Folosim ensureEventOwnerOrAdmin pentru event-ul de care aparține
    const ev = await ensureEventOwnerOrAdmin(user, program.eventId, reply);
    if (!ev) return;

    await prisma.eventProgram.delete({ where: { id: programId } });

    return reply.code(204).send();
  });

  // --- TASKS: PATCH /events/:id/tasks/:taskId ---
app.patch('/events/:id/tasks/:taskId', async (req, res) => {
  const reply = makeReply(res);
  const user = await app.verifyAuth(req);
  const { id, taskId } = req.params;

  const ev = await ensureEventOwnerOrAdmin(user, id, reply);
  if (!ev) return;

  const existing = await prisma.eventTask.findFirst({
    where: { id: taskId, eventId: id },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, status, dueDate } = req.body || {};
  const data = {};

  if (title !== undefined) {
    const t = String(title).trim();
    if (!t) {
      return res.status(400).json({ error: 'Titlul nu poate fi gol.' });
    }
    data.title = t;
  }

  if (status !== undefined) {
    const allowed = ['TODO', 'IN_PROGRESS', 'DONE'];
    const s = String(status);
    if (!allowed.includes(s)) {
      return res
        .status(400)
        .json({ error: 'Status invalid pentru task', allowed });
    }
    data.status = s;
  }

  if (dueDate !== undefined) {
    if (dueDate === null || dueDate === '') {
      data.dueDate = null;
    } else {
      const d = new Date(dueDate);
      if (Number.isNaN(d.getTime())) {
        return res
          .status(400)
          .json({ error: 'Format invalid pentru `dueDate`.' });
      }
      data.dueDate = d;
    }
  }

  const updated = await prisma.eventTask.update({
    where: { id: taskId },
    data,
  });

  return reply.send(updated);
});

// --- TASKS: DELETE /events/:id/tasks/:taskId ---
app.delete('/events/:id/tasks/:taskId', async (req, res) => {
  const user = await app.verifyAuth(req);
  const { id, taskId } = req.params;

  // folosim makeReply DOAR pentru ensureEventOwnerOrAdmin (dacă vrei)
  const reply = makeReply(res);
  const ev = await ensureEventOwnerOrAdmin(user, id, reply);
  if (!ev) return;

  const existing = await prisma.eventTask.findFirst({
    where: { id: taskId, eventId: id },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  await prisma.eventTask.delete({ where: { id: taskId } });

  // IMPORTANT: pentru 204 nu trimitem body și nu mai folosim reply
  return res.status(204).end();
});

}
