// src/routes/eventBriefBudget.js
import { prisma } from '../db.js';

// helper stil Fastify reply (ca în celelalte rute Express-like)
function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({
    send: (body) => res.status(status).json(body),
  });
  return f;
}

// Helper pentru a lua ultimul template definit pentru un tip de eveniment
async function getEventTypeTemplateByType(type) {
  if (!type) return null;

  return prisma.eventTypeTemplate.findFirst({
    where: { type },
    orderBy: { createdAt: 'desc' },
  });
}

// Helper de acces la eveniment (owner / participant / admin)
async function ensureEventAccess(user, eventId) {
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      participants: true,
    },
  });

  if (!ev) {
    return {
      error: { status: 404, body: { error: 'Event not found' } },
    };
  }

  // admin vede tot
  if (user?.role === 'admin') {
    return { event: ev };
  }

  const uid = (user?.userId ?? user?.id ?? '').toString();
  if (!uid) {
    return {
      error: { status: 401, body: { error: 'Unauthenticated' } },
    };
  }

  const isOwner = ev.clientId === uid;
  const isParticipant = ev.participants?.some((p) => p.userId === uid);

  if (!isOwner && !isParticipant) {
    return {
      error: { status: 403, body: { error: 'Forbidden' } },
    };
  }

  return { event: ev };
}

export async function eventBriefBudgetRoutes(app) {
  // --- BRIEF TEMPLATE: GET /events/:id/brief-template ---
  app.get('/events/:id/brief-template', async (req, res) => {
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    try {
      const { event, error } = await ensureEventAccess(user, id);
      if (error) {
        return res.status(error.status).json(error.body);
      }

      const tpl = await getEventTypeTemplateByType(event.type);

      // dacă nu există template pentru tipul ăsta -> 404,
      // UI-ul tău tratează .ok === false ca "nu afișez cardul"
      if (!tpl || !tpl.briefJson) {
        return res
          .status(404)
          .json({ error: 'No brief template for this event type' });
      }

      const raw = tpl.briefJson || {};

      const label =
        raw.label ||
        tpl.name ||
        event.type ||
        'Brief eveniment';
      const intro = raw.intro || null;
      const tips = Array.isArray(raw.tips) ? raw.tips : [];
      const sections = Array.isArray(raw.sections) ? raw.sections : [];

      return res.json({
        hasTemplate: true,
        type: event.type,
        label,
        intro,
        tips,
        sections,
        rawTemplate: raw,
      });
    } catch (err) {
      console.error('GET /events/:id/brief-template error:', err);
      return res
        .status(500)
        .json({ error: 'Internal error in brief-template route' });
    }
  });

  // --- Estimare buget pentru un eveniment ---
  app.get('/events/:id/budget-estimate', async (req, res) => {
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const { event, error } = await ensureEventAccess(user, id);
    if (error) {
      return res.status(error.status).json(error.body);
    }

    if (!event.type) {
      return res
        .status(400)
        .json({ error: 'Event type is not set.' });
    }

    const tpl = await getEventTypeTemplateByType(event.type);

    if (!tpl || !tpl.budgetJson) {
      return res
        .status(404)
        .json({ error: 'No budget template for this event type' });
    }

    const cfg = tpl.budgetJson || {};
    const guestCount = event.guestCount ?? null;
    const plannedBudget = event.budgetPlanned ?? null;

    const basePerGuest = Number(cfg.basePerGuest ?? 0) || 0;
    const templateCurrency = cfg.currency || event.currency || 'RON';

    let baseTotal = null;
    let source = 'template';

    if (plannedBudget && Number(plannedBudget) > 0) {
      baseTotal = Number(plannedBudget);
      source = 'event';
    } else if (guestCount && basePerGuest > 0) {
      baseTotal = guestCount * basePerGuest;
      source = 'template-per-guest';
    }

    if (!baseTotal || !Number.isFinite(baseTotal)) {
      return res.status(400).json({
        error:
          'Nu se poate calcula bugetul estimativ. Lipsesc fie "guestCount", fie "budgetPlanned", fie "basePerGuest" în template.',
      });
    }

    const categories = Array.isArray(cfg.categories)
      ? cfg.categories
      : [];
    const totalPercent = categories.reduce(
      (sum, c) => sum + Number(c.percent ?? 0),
      0
    );

    const normalizedCategories =
      totalPercent > 0
        ? categories
        : [{ key: 'general', label: 'Buget general', percent: 100 }];

    const perCategory = normalizedCategories.map((c) => {
      const p = Number(c.percent ?? 0);
      const amount = (baseTotal * p) / 100;
      return {
        key: c.key || `cat_${p}`,
        label: c.label || 'Categorie',
        percent: p,
        amount,
      };
    });

    return res.json({
      eventId: event.id,
      type: tpl.type,
      label: tpl.label,
      guestCount,
      plannedBudget,
      currency: templateCurrency,
      baseTotal,
      source,
      categories: perCategory,
    });
  });

  // --- BRIEF TEMPLATE: PUT /events/:id/brief-template ---
  app.put('/events/:id/brief-template', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    // doar admin-ul are voie să modifice template-urile globale
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const ev = await prisma.event.findUnique({ where: { id } });
    if (!ev) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const body = req.body || {};
    const briefJson = {
      label: body.label || null,
      intro: body.intro || null,
      tips: Array.isArray(body.tips) ? body.tips : [],
      sections: Array.isArray(body.sections) ? body.sections : [],
    };

    const existing = await getEventTypeTemplateByType(ev.type);

    let saved;
    if (!existing) {
      // creăm unul nou pentru tipul respectiv
      saved = await prisma.eventTypeTemplate.create({
        data: {
          type: ev.type,
          name: 'default', // important pentru @@unique([type, name])
          briefJson,
        },
      });
    } else {
      // actualizăm template-ul existent
      saved = await prisma.eventTypeTemplate.update({
        where: { id: existing.id },
        data: { briefJson },
      });
    }

    return reply.send({
      ok: true,
      templateId: saved.id,
      type: saved.type,
      briefJson: saved.briefJson,
    });
  });
}
