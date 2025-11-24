// services/events-service/src/routes/eventTemplates.js
import { prisma } from '../db.js';

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

async function getEventTypeTemplateByType(type) {
  if (!type) return null;

  // dacă ai mai multe template-uri per tip, îl luăm pe cel mai nou
  return prisma.eventTypeTemplate.findFirst({
    where: { type },
    orderBy: { createdAt: 'desc' },
  });
}

// normalizăm un „task” din payload în forma canonică
function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) return [];

  const cleaned = [];

  tasks.forEach((t, idx) => {
    if (!t) return;
    const title = (t.title ?? '').toString().trim();
    if (!title) return;

    let daysBefore = null;
    let offsetDays = null;

    if (t.daysBefore !== undefined && t.daysBefore !== null && t.daysBefore !== '') {
      const n = Number(t.daysBefore);
      if (!Number.isNaN(n)) daysBefore = n;
    }

    if (t.offsetDays !== undefined && t.offsetDays !== null && t.offsetDays !== '') {
      const n = Number(t.offsetDays);
      if (!Number.isNaNa(n)) offsetDays = n;
    }

    const order =
      t.order !== undefined && t.order !== null && t.order !== ''
        ? Number(t.order)
        : idx;

    cleaned.push({
      title,
      daysBefore: daysBefore,
      offsetDays: offsetDays,
      section: t.section ? String(t.section) : null,
      optional: Boolean(t.optional),
      order,
    });
  });

  return cleaned;
}

export async function eventTemplatesRoutes(app) {
  // LISTĂ TEMPLATES
  app.get('/admin/event-templates', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { type, q } = req.query || {};
    const where = {};

    if (type) {
      where.type = String(type);
    }

    if (q) {
      const query = String(q);
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { type: { contains: query, mode: 'insensitive' } },
      ];
    }

    const rows = await prisma.eventTypeTemplate.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return reply.send({ rows, total: rows.length });
  });

  // DETALIU
  app.get('/admin/event-templates/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const tpl = await prisma.eventTypeTemplate.findUnique({ where: { id } });
    if (!tpl) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return reply.send(tpl);
  });

  // CREARE
  app.post('/admin/event-templates', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { type, name, description, tasks } = req.body || {};

    const typeStr = (type ?? '').toString().trim();
    const nameStr = (name ?? '').toString().trim();

    if (!typeStr) {
      return res.status(400).json({ error: '`type` is required' });
    }
    if (!nameStr) {
      return res.status(400).json({ error: '`name` is required' });
    }

    const taskJson = normalizeTasks(tasks);

    const created = await prisma.eventTypeTemplate.create({
      data: {
        type: typeStr,
        name: nameStr,
        description: description ? String(description) : null,
        taskJson,
      },
    });

    return reply.code(201).send(created);
  });

  // UPDATE
  app.put('/admin/event-templates/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const existing = await prisma.eventTypeTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { type, name, description, tasks } = req.body || {};
    const data = {};

    if (type !== undefined) {
      const t = (type ?? '').toString().trim();
      if (!t) return res.status(400).json({ error: '`type` cannot be empty' });
      data.type = t;
    }

    if (name !== undefined) {
      const n = (name ?? '').toString().trim();
      if (!n) return res.status(400).json({ error: '`name` cannot be empty' });
      data.name = n;
    }

    if (description !== undefined) {
      data.description = description ? String(description) : null;
    }

    if (tasks !== undefined) {
      data.taskJson = normalizeTasks(tasks);
    }

    const updated = await prisma.eventTypeTemplate.update({
      where: { id },
      data,
    });

    return reply.send(updated);
  });

  // DELETE (hard delete, pentru început)
  app.delete('/admin/event-templates/:id', async (req, res) => {
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const existing = await prisma.eventTypeTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await prisma.eventTypeTemplate.delete({ where: { id } });

    return res.status(204).end();
  });
}
