// src/routes/eventTypes.js
import { prisma } from '../db.js';
import { isAdminUser } from '../services/authz.js';

async function getEventTypeTemplateByType(type) {
  if (!type) return null;

  // dacă ai mai multe template-uri per tip, îl luăm pe cel mai nou
  return prisma.eventTypeTemplate.findFirst({
    where: { type },
    orderBy: { createdAt: 'desc' },
  });
}

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({
    send: (body) => res.status(status).json(body),
  });
  return f;
}

export async function eventTypesRoutes(app) {
  // --- Admin: listă completă cu JSON-urile de config ---
  app.get('/admin/event-types', async (req, res) => {
    const user = await app.verifyAuth(req);
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const items = await prisma.eventTypeTemplate.findMany({
      orderBy: { type: 'asc' },
    });

    return res.json({ items });
  });

  // --- Admin: un singur tip după "type" ---
  app.get('/admin/event-types/:type', async (req, res) => {
    const user = await app.verifyAuth(req);
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { type } = req.params;
    const tpl = await getEventTypeTemplateByType(type);

    if (!tpl) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    return res.json(tpl);
  });

  // --- Admin: update briefJson + budgetJson ---
  app.put('/admin/event-types/:type', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { type } = req.params;

    // doar admin are voie să modifice șabloanele globale
    if (!isAdminUser(user)) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const body = req.body || {};
    const label = (body.label || '').toString().trim();

    if (!label) {
      return reply.code(400).send({
        error: 'Câmpul "label" este obligatoriu.',
      });
    }

    // briefJson: acceptăm orice obiect; dacă vine string sau altceva, punem default
    let briefJson =
      body.briefJson && typeof body.briefJson === 'object'
        ? body.briefJson
        : {
            intro: '',
            tips: [],
          };

    // buget: la fel, obiect liber, dar normalizăm puțin
    let budgetJson =
      body.budgetJson && typeof body.budgetJson === 'object'
        ? body.budgetJson
        : {
            basePerGuest: 0,
            currency: 'RON',
            categories: [],
          };

    // Normalizare minimă pentru categories (dacă există)
    if (Array.isArray(budgetJson.categories)) {
      budgetJson = {
        ...budgetJson,
        categories: budgetJson.categories.map((c, idx) => ({
          key: c.key || `cat_${idx + 1}`,
          label: c.label || `Categorie ${idx + 1}`,
          percent: Number.isFinite(Number(c.percent))
            ? Number(c.percent)
            : 0,
        })),
      };
    }

    // dacă vrei, poți stoca label-ul și în briefJson:
    if (!briefJson.label) {
      briefJson = { ...briefJson, label };
    }

    // Căutăm ultimul template pentru acest tip (name: 'default' dacă folosești @@unique([type, name]))
    const existing = await prisma.eventTypeTemplate.findFirst({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });

    let saved;
    if (!existing) {
      // creăm un nou template pentru tipul respectiv
      saved = await prisma.eventTypeTemplate.create({
        data: {
          type,
          name: 'default', // important pentru @@unique([type, name])
          label,
          briefJson,
          budgetJson,
        },
      });
    } else {
      // actualizăm template-ul existent
      saved = await prisma.eventTypeTemplate.update({
        where: { id: existing.id },
        data: {
          label,
          briefJson,
          budgetJson,
        },
      });
    }

    return reply.send({
      ok: true,
      templateId: saved.id,
      type: saved.type,
      // label-ul îl dăm explicit
      label,
      briefJson: saved.briefJson,
      budgetJson: saved.budgetJson,
    });
  });

  // --- Public: listă simplă de tipuri (fără JSON mare, pentru dropdown-uri etc.) ---
  app.get('/event-types', async (req, res) => {
    const items = await prisma.eventTypeTemplate.findMany({
      select: { type: true, label: true },
      orderBy: { type: 'asc' },
    });

    return res.json({ items });
  });
}
