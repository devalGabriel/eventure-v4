// services/events-service/src/routes/adminPreContract.js
import { prisma } from '../db.js';
import { BadRequest } from '../errors.js';

// mic adapter ca în celelalte rute
function makeReply(res) {
    const f = (body) => res.json(body);
    f.send = (body) => res.json(body);
    f.code = (status) => ({ send: (body) => res.status(status).json(body) });
    return f;
}

function isAdmin(user) {
    return Array.isArray(user?.roles) && user.roles.includes('ADMIN');
}

// Heuristici pentru status global pre-contract
function computePreContractStatus({ invitationsCount, offersCount, assignments }) {
    const shortlisted = assignments.SHORTLISTED || 0;
    const selected = assignments.SELECTED || 0;
    const confirmed = assignments.CONFIRMED_PRE_CONTRACT || 0;

    if (confirmed > 0) return 'providers_selected';
    if (selected > 0 || shortlisted > 0 || offersCount > 0) return 'in_negotiation';
    if (invitationsCount > 0) return 'invitations_sent';
    return 'no_activity';
}

/**
 * GET /admin/events/pre-contract
 * Query params:
 *   from      (ISO date, inclusive)
 *   to        (ISO date, inclusive)
 *   clientId
 *   providerId
 *   status    (no_activity | invitations_sent | in_negotiation | providers_selected)
 */
export async function adminPreContractRoutes(app) {
    app.get('/admin/events/pre-contract', async (req, res) => {
        const reply = makeReply(res);
        const user = await app.verifyAuth(req);
        if (!isAdmin(user)) {
            return reply.code(403).send({ error: 'Forbidden' });
        }

        const { from, to, clientId, providerId, status } = req.query || {};

        const where = {};

        if (from || to) {
            where.date = {};
            if (from) {
                const d = new Date(from);
                if (Number.isNaN(d.getTime())) return reply.code(400).send({ error: 'Invalid from date' });
                where.date.gte = d;
            }
            if (to) {
                const d = new Date(to);
                if (Number.isNaN(d.getTime())) return reply.code(400).send({ error: 'Invalid to date' });
                where.date.lte = d;
            }
        }

        if (clientId) {
            where.clientId = clientId;
        }

        // Deocamdată fără paginare complicată – limit rezonabil
        const events = await prisma.event.findMany({
            where,
            orderBy: { date: 'asc' },
            take: 200
        });

        if (!events.length) {
            return reply.send({ rows: [], total: 0 });
        }

        const eventIds = events.map((e) => e.id);

        const [invites, offers, assignments] = await Promise.all([
            prisma.eventInvitation.findMany({
                where: { eventId: { in: eventIds } },
                select: { eventId: true, providerId: true, status: true }
            }),
            prisma.eventOffer.findMany({
                where: { eventId: { in: eventIds } },
                select: { eventId: true, providerId: true, status: true }
            }),
            prisma.eventProviderAssignment.findMany({
                where: { eventId: { in: eventIds } },
                select: { eventId: true, providerId: true, status: true }
            })
        ]);

        // Agregare per eventId
        const perEvent = new Map();

        for (const ev of events) {
            perEvent.set(ev.id, {
                event: ev,
                invitationsCount: 0,
                offersCount: 0,
                assignmentsCounts: {
                    SHORTLISTED: 0,
                    SELECTED: 0,
                    CONFIRMED_PRE_CONTRACT: 0
                },
                providersInvolved: new Set()
            });
        }

        for (const inv of invites) {
            const entry = perEvent.get(inv.eventId);
            if (!entry) continue;
            entry.invitationsCount += 1;
            if (inv.providerId) entry.providersInvolved.add(inv.providerId);
        }

        for (const ofr of offers) {
            const entry = perEvent.get(ofr.eventId);
            if (!entry) continue;
            entry.offersCount += 1;
            if (ofr.providerId) entry.providersInvolved.add(ofr.providerId);
        }

        for (const asg of assignments) {
            const entry = perEvent.get(asg.eventId);
            if (!entry) continue;
            if (asg.providerId) entry.providersInvolved.add(asg.providerId);
            if (entry.assignmentsCounts[asg.status] != null) {
                entry.assignmentsCounts[asg.status] += 1;
            }
        }

        let rows = Array.from(perEvent.values()).map((row) => {
            const statusGlobal = computePreContractStatus({
                invitationsCount: row.invitationsCount,
                offersCount: row.offersCount,
                assignments: row.assignmentsCounts
            });

            let isAtRisk = false;
            if (row.event.date) {
                const now = Date.now();
                const d = new Date(row.event.date).getTime();
                const diffDays = (d - now) / (1000 * 60 * 60 * 24);
                if (diffDays >= 0 && diffDays <= 14 && statusGlobal !== 'providers_selected') {
                    isAtRisk = true;
                }
            }

            return {
                eventId: row.event.id,
                name: row.event.name,
                clientId: row.event.clientId,
                date: row.event.date,
                location: row.event.location,
                invitationsCount: row.invitationsCount,
                offersCount: row.offersCount,
                assignments: row.assignmentsCounts,
                providersInvolved: Array.from(row.providersInvolved),
                preContractStatus: statusGlobal,
                isAtRisk,
            };
        });

        // Filtrare după providerId la nivel de rezultat agregat
        if (providerId) {
            rows = rows.filter((r) => r.providersInvolved.includes(providerId));
        }

        if (status) {
            rows = rows.filter((r) => r.preContractStatus === status);
        }

        return reply.send({
            rows,
            total: rows.length
        });
    });

}
