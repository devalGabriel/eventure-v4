// services/events-service/src/routes/providers.js
import { prisma } from '../db.js';
import { BadRequest, NotFound } from '../errors.js';
import {
  getProviderState,
  ensureProviderAccess,
} from '../services/providerAccess.js';
import { isAdminUser, getUserId } from '../services/authz.js';

function publish(app, subject, payload) {
  try {
    const nc = app.nats;
    if (!nc || !subject) return;
    nc.publish(subject, Buffer.from(JSON.stringify(payload || {})));
  } catch (e) {
    app.log?.warn?.({ err: e, subject }, 'events-service publish warn');
  }
}

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({ send: (body) => res.status(status).json(body) });
  return f;
}

// helper: citește minimal user info din users-service
async function fetchUsersBasic(ids = []) {
  const USERS_URL = (process.env.USERS_URL || '').replace(/\/$/, '');
  if (!USERS_URL || !ids.length) return {};
  try {
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const r = await fetch(`${USERS_URL}/v1/users/${id}`, {
            method: 'GET',
          }).catch((err) => {
            console.log('error fetch: ', err);
          });
          if (!r || !r.ok) return [id, null];
          const u = await r.json().catch(() => null);
          const email = u?.email || u?.primaryEmail || null;
          const name = u?.name || u?.fullName || u?.displayName || null;
          return [id, { id, email, name }];
        } catch (err) {
          console.log('users fetch error: ', err);
          return [id, null];
        }
      })
    );
    return Object.fromEntries(results);
  } catch {
    return {};
  }
}

export async function providersRoutes(app) {
  // status & profil curent
  app.get('/providers/me', async (req, res) => {
    const user = await app.verifyAuth(req);
    const userIdStr = getUserId(user) || null;
    if (!userIdStr) return res.status(401).json({ error: 'Unauthenticated' });

    const st = await getProviderState(userIdStr);
    return res.json(st);
  });

  // aplica ca provider (creează sau readuce aplicația existentă)
  app.post('/providers/apply', async (req, res) => {
    const user = await app.verifyAuth(req);
    const userIdStr = getUserId(user) || null;
    if (!userIdStr) return res.status(401).json({ error: 'Unauthenticated' });

    const { note } = req.body || {};
    const exist = await prisma.providerApplication.findUnique({
      where: { userId: userIdStr },
    });
    if (exist) {
      if (exist.status === 'REJECTED') {
        const upd = await prisma.providerApplication.update({
          where: { userId: userIdStr },
          data: {
            status: 'PENDING',
            note: note ?? exist.note,
            createdAt: new Date(),
            decidedAt: null,
            decidedBy: null,
          },
        });
        publish(
          app,
          process.env.NATS_TOPIC_PROVIDER_APPLY || 'provider.apply.created',
          {
            userId: userIdStr,
            note: note || null,
            status: 'PENDING',
            at: new Date().toISOString(),
          }
        );
        return res.json(upd);
      }
      // EXISTENT (PENDING/APPROVED) – returnează-l, UI trebuie să arate statusul
      return res.json(exist);
    }

    const created = await prisma.providerApplication.create({
      data: { userId: userIdStr, note: note || null, status: 'PENDING' },
    });

    publish(
      app,
      process.env.NATS_TOPIC_PROVIDER_APPLY || 'provider.apply.created',
      {
        userId: userIdStr,
        note: note || null,
        status: 'PENDING',
        at: new Date().toISOString(),
      }
    );

    return res.json(created);
  });

  // profil furnizor (upsert după aprobare)
  app.put('/providers/me', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderAccess(user, reply);
    if (!ok) return;

    const userIdStr = getUserId(user) || null;
    if (!userIdStr) return res.status(401).json({ error: 'Unauthenticated' });

    const {
      displayName,
      description,
      phone,
      location,
      mediaUrl,
      status,
    } = req.body || {};
    const existing = await prisma.providerProfile.findUnique({
      where: { userId: userIdStr },
    });

    const data = {
      displayName: displayName ?? existing?.displayName ?? 'Provider',
      description: description ?? null,
      phone: phone ?? null,
      location: location ?? null,
      mediaUrl: mediaUrl ?? null,
      ...(status ? { status } : {}),
    };

    const saved = existing
      ? await prisma.providerProfile.update({
          where: { userId: userIdStr },
          data,
        })
      : await prisma.providerProfile.create({
          data: { userId: userIdStr, ...data },
        });

    return res.json(saved);
  });

  // admin: list & decision
  app.get('/admin/provider-applications', async (req, res) => {
    const user = await app.verifyAuth(req);
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const status = String(req.query.status || 'PENDING');
    const page = Number(req.query.page || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize || 20));

    const where = status ? { status } : {};
    const [rows, total] = await Promise.all([
      prisma.providerApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.providerApplication.count({ where }),
    ]);

    // îmbogățește cu nume/email dacă ai USERS_URL
    const ids = [...new Set(rows.map((r) => r.userId).filter(Boolean))];
    const usersMap = await fetchUsersBasic(ids);
    const enriched = rows.map((r) => {
      const u = usersMap[r.userId];
      return u ? { ...r, applicant: u } : r;
    });

    return res.json({ rows: enriched, total, page, pageSize });
  });

  app.post('/admin/provider-applications/:id/decision', async (req, res) => {
    const current = await app.verifyAuth(req);
    if (!isAdminUser(current)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const adminId = getUserId(current) || null;
    const { id } = req.params;
    const body = req.body || {};

    let rawStatus = body.status ?? body.decision ?? '';
    let { reasonCode, reasonText } = body;

    // 🔎 normalizare status
    let statusNorm = (rawStatus || '').toString().trim().toUpperCase();

    if (statusNorm === 'APPROVE') statusNorm = 'APPROVED';
    if (statusNorm === 'REJECT') statusNorm = 'REJECTED';

    // fallback: dacă avem motiv dar nu status clar → considerăm REJECTED
    if (!statusNorm && (reasonCode || reasonText)) {
      statusNorm = 'REJECTED';
    }

    // dacă TOT e ciudat, nu mai dăm 400 – logăm și tratăm ca REJECTED generic
    if (!statusNorm) {
      app.log?.warn?.(
        { body },
        'provider decision: missing status, defaulting to REJECTED'
      );
      statusNorm = 'REJECTED';
    }

    // la REJECTED asigurăm motiv minim
    if (statusNorm === 'REJECTED' && !reasonCode && !reasonText) {
      reasonCode = 'OTHER';
      reasonText = 'Decision reason not specified.';
    }

    const appRec = await prisma.providerApplication.findUnique({
      where: { id },
    });
    if (!appRec) {
      throw NotFound('Application not found');
    }

    const updated = await prisma.providerApplication.update({
      where: { id },
      data: {
        status: statusNorm,
        decidedAt: new Date(),
        decidedBy: adminId,
        decisionReasonCode: reasonCode || null,
        decisionReasonText: reasonText || null,
      },
    });

    // dacă e aprobat, ne asigurăm că există profil provider
    if (updated.status === 'APPROVED') {
      const prof = await prisma.providerProfile.findUnique({
        where: { userId: appRec.userId },
      });
      if (!prof) {
        await prisma.providerProfile.create({
          data: {
            userId: appRec.userId,
            displayName: 'Provider',
            status: 'ACTIVE',
          },
        });
      }

      // opțional: update rol în users-service
      const USERS_URL = (process.env.USERS_URL || '').replace(/\/$/, '');
      if (USERS_URL) {
        try {
          await fetch(`${USERS_URL}/v1/users/${appRec.userId}/roles`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ add: ['PROVIDER'], remove: [] }),
          });
        } catch (err) {
          app.log?.error?.(
            { err },
            'Failed to update roles in users-service on provider approval'
          );
        }
      }
    }

    // NATS event pentru notificări & alte servicii
    publish(
      app,
      process.env.NATS_TOPIC_PROVIDER_DECIDED || 'provider.apply.decided',
      {
        applicationId: updated.id,
        userId: appRec.userId,
        status: updated.status,
        reasonCode: updated.decisionReasonCode || null,
        reasonText: updated.decisionReasonText || null,
        decidedAt:
          updated.decidedAt?.toISOString?.() || new Date().toISOString(),
        decidedBy: adminId,
      }
    );

    return res.json(updated);
  });
}
