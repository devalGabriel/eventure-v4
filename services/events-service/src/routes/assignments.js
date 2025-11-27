// services/events-service/src/routes/assignments.js
import { prisma } from '../db.js';
import { BadRequest, NotFound } from '../errors.js';
import { ensureEventOwnerOrAdmin, ensureProviderOrAdmin } from '../services/eventsAccess.js';

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({ send: (body) => res.status(status).json(body) });
  return f;
}

const ASSIGNMENT_ALLOWED_STATUS = [
  'SHORTLISTED',
  'SELECTED',
  'CONFIRMED_PRE_CONTRACT',
];

const ASSIGNMENT_TRANSITIONS = {
  SHORTLISTED: ['SHORTLISTED', 'SELECTED', 'CONFIRMED_PRE_CONTRACT'],
  SELECTED: ['SELECTED', 'CONFIRMED_PRE_CONTRACT'],
  CONFIRMED_PRE_CONTRACT: ['CONFIRMED_PRE_CONTRACT'],
};

export function assignmentsRoutes(app) {
  // CREATE – doar client owner sau admin
  app.post('/events/:eventId/assignments', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
    if (!ev && user.role !== 'admin') return;

    const body = req.body || {};
    const providerId = body.providerId || null;
    const providerGroupId = body.providerGroupId || null;
    console.log("body:", body);
    if (!providerId && !providerGroupId) {
      throw BadRequest('providerId or providerGroupId is required');
    }
    if (providerId && providerGroupId) {
      throw BadRequest('Use either providerId OR providerGroupId, not both');
    }

    let status =
      body.status && ASSIGNMENT_ALLOWED_STATUS.includes(body.status)
        ? body.status
        : 'SHORTLISTED';

    // VALIDARE: trebuie ofertă validă SAU invitație acceptată
     let sourceOfferId = body.sourceOfferId || null;

  const OFFER_OK_STATUSES = ['SENT', 'ACCEPTED_BY_CLIENT'];

  let offer = null;
  if (sourceOfferId) {
    offer = await prisma.eventOffer.findUnique({ where: { id: sourceOfferId } });
    if (!offer || offer.eventId !== eventId) {
      throw BadRequest('sourceOfferId must belong to the same event');
    }
    if (!OFFER_OK_STATUSES.includes(offer.status)) {
      throw BadRequest(
        `sourceOfferId must have status one of: ${OFFER_OK_STATUSES.join(', ')}`
      );
    }
  } else {
    offer = await prisma.eventOffer.findFirst({
      where: {
        eventId,
        providerId,
        status: { in: OFFER_OK_STATUSES },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!offer) {
      throw BadRequest(
        'Cannot create assignment: provider has no valid offer (SENT / ACCEPTED_BY_CLIENT) for this event'
      );
    }
    sourceOfferId = offer.id;
  }

      const existing = await prisma.eventProviderAssignment.findFirst({
    where: {
      eventId,
      providerId,
      providerGroupId,
    },
  });

  let result;
  if (existing) {
    result = await prisma.eventProviderAssignment.update({
      where: { id: existing.id },
      data: {
        status,
        sourceOfferId,
        notes: body.notes ?? existing.notes,
      },
    });
  } else {
    result = await prisma.eventProviderAssignment.create({
      data: {
        eventId,
        providerId,
        providerGroupId,
        status,
        sourceOfferId,
        notes: body.notes || null,
      },
    });
  }

  return reply.code(existing ? 200 : 201).send(result);

  });

  // LIST pe eveniment (client owner, provider implicat, admin)
  app.get('/events/:eventId/assignments', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId } = req.params;

    let where = { eventId };

    if (user.role === 'provider') {
      where = {
        ...where,
        providerId: user.userId?.toString() || '',
      };
    } else if (user.role !== 'admin') {
      const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
      if (!ev) return;
    }

    const rows = await prisma.eventProviderAssignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(rows);
  });

  // UPDATE status – PATCH /assignments/:id
  app.patch('/assignments/:id', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;
    const { status } = req.body || {};

    if (!status || !ASSIGNMENT_ALLOWED_STATUS.includes(status)) {
      throw BadRequest('Invalid status');
    }

    const asg = await prisma.eventProviderAssignment.findUnique({ where: { id } });
    if (!asg) throw NotFound('Assignment not found');

    // doar client owner sau admin pot schimba status assignment
    if (user.role !== 'admin') {
      const ev = await ensureEventOwnerOrAdmin(user, asg.eventId, reply);
      if (!ev) return;
    }

    const allowedNext =
      ASSIGNMENT_TRANSITIONS[asg.status] || [asg.status];
    if (!allowedNext.includes(status)) {
      throw BadRequest(
        `Invalid transition from ${asg.status} to ${status}`
      );
    }

    const updated = await prisma.eventProviderAssignment.update({
      where: { id },
      data: { status },
    });

    if (nextStatus === 'SELECTED' || nextStatus === 'CONFIRMED_PRE_CONTRACT') {
      await sendNotification({
        userId: assignment.providerId,
        type: 'EVENT_PROVIDER_SELECTED',
        title:
          nextStatus === 'SELECTED'
            ? 'Ai fost selectat pentru un eveniment'
            : 'Ești confirmat pre-contract',
        body: `Eveniment: "${assignment.event.name}". Status: ${nextStatus}.`,
        meta: {
          eventId: assignment.eventId,
          assignmentId: assignment.id,
          status: nextStatus,
        },
      });
    }
    return reply.send(updated);
  });

  // PROVIDER: lista evenimentelor unde e selectat / pre-contract
  app.get('/providers/me/assignments', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const providerId = user.userId?.toString() || '';

    const rows = await prisma.eventProviderAssignment.findMany({
      where: {
        providerId,
        status: { in: ['SELECTED', 'CONFIRMED_PRE_CONTRACT'] },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            type: true,
            location: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(rows);
  });
}
