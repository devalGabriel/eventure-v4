// services/events-service/src/routes/assignments.js
import { prisma } from '../db.js';
import { BadRequest, NotFound } from '../errors.js';
import {
  ensureEventOwnerOrAdmin,
  ensureProviderOrAdmin,
} from '../services/eventsAccess.js';
import {
  isAdminUser,
  isProviderUser,
  getUserId,
} from '../services/authz.js';
import { sendNotification } from '../services/notificationsClient.js';
import { enqueueDomainEvent } from '../services/outbox.js';

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
    if (!ev && !isAdminUser(user)) return;

    const body = req.body || {};
    const providerId = body.providerId || null;
    const providerGroupId = body.providerGroupId || null;

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
    const isUpdate = !!existing;

    if (isUpdate) {
      result = await prisma.eventProviderAssignment.update({
        where: { id: existing.id },
        data: {
          status,
          sourceOfferId,
          notes: body.notes ?? existing.notes,
          // dacă ai adăugat version în schema:
          // version: { increment: 1 },
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

    await enqueueDomainEvent({
      aggregateType: "EventProviderAssignment",
      aggregateId: result.id,
      type: isUpdate
        ? "events.precontract.assignment.updated"
        : "events.precontract.assignment.created",
      payload: {
        eventId,
        assignmentId: result.id,
        providerId: result.providerId,
        providerGroupId: result.providerGroupId,
        status: result.status,
        sourceOfferId: result.sourceOfferId,
      },
    });

    return reply.code(isUpdate ? 200 : 201).send(result);

  });

  // LIST pe eveniment (client owner, provider implicat, admin)
  app.get('/events/:eventId/assignments', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { eventId } = req.params;

    let where = { eventId };

    if (isProviderUser(user)) {
      where = {
        ...where,
        providerId: getUserId(user),
      };
    } else if (!isAdminUser(user)) {
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

    const asg = await prisma.eventProviderAssignment.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!asg) throw NotFound('Assignment not found');

    // doar client owner sau admin pot schimba status assignment
    if (!isAdminUser(user)) {
      const ev = await ensureEventOwnerOrAdmin(user, asg.eventId, reply);
      if (!ev) return;
    }

    const allowedNext = ASSIGNMENT_TRANSITIONS[asg.status] || [asg.status];
    if (!allowedNext.includes(status)) {
      throw BadRequest(
        `Invalid transition from ${asg.status} to ${status}`
      );
    }

        const updated = await prisma.eventProviderAssignment.update({
      where: { id },
      data: {
        status,
        version: { increment: 1 }, // dacă ai version în schema
      },
    });

    await enqueueDomainEvent({
      aggregateType: "EventProviderAssignment",
      aggregateId: updated.id,
      type: "events.precontract.assignment.statusChanged",
      payload: {
        eventId: updated.eventId,
        assignmentId: updated.id,
        fromStatus: asg.status,
        toStatus: updated.status,
      },
    });


    // notificăm providerul la SELECTED / CONFIRMED_PRE_CONTRACT
    if (status === 'SELECTED' || status === 'CONFIRMED_PRE_CONTRACT') {
      if (asg.providerId) {
        await sendNotification({
          userId: asg.providerId,
          type: 'EVENT_PROVIDER_SELECTED',
          title:
            status === 'SELECTED'
              ? 'Ai fost selectat pentru un eveniment'
              : 'Ești confirmat pre-contract',
          body: `Eveniment: "${asg.event?.name || ''}". Status: ${status}.`,
          meta: {
            eventId: asg.eventId,
            assignmentId: asg.id,
            status,
          },
        });
      }
    }

    return reply.send(updated);
  });

  // PROVIDER: lista evenimentelor unde e selectat / pre-contract
  app.get('/providers/me/assignments', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const ok = await ensureProviderOrAdmin(user, reply);
    if (!ok) return;

    const providerId = getUserId(user);

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
