// services/users-service/src/consumers/providerDecided.js
const { enqueueOutbox } = require('../lib/outbox');
const { OUT } = require('../lib/events');

async function ensureRole(prisma, name) {
  await prisma.role.upsert({
    where: { name },
    update: {},
    create: { name }
  });
}

async function registerProviderDecidedConsumer(fastify) {
  const { nats, prisma } = fastify;
  const log = fastify.log.child({ consumer: 'providerDecided' });

  if (!nats) {
    log.warn('NATS not available, skipping providerDecided consumer');
    return;
  }

  const subj = process.env.NATS_TOPIC_PROVIDER_DECIDED || 'provider.apply.decided';
  const sub = nats.subscribe(subj);

  (async () => {
    for await (const m of sub) {
      try {
        const evt = JSON.parse(m.data.toString());
        const { userId, status } = evt || {};

        // ne interesează doar aprobările
        if (!userId) continue;
        if (!status || !['approved', 'APPROVED'].includes(String(status))) continue;

        // găsim profilul după:
        //  - id (UUID)
        //  - sau authUserId (id-ul din auth-service)
        const profile = await prisma.userProfile.findFirst({
          where: {
            OR: [
              { id: String(userId) },
              { authUserId: String(userId) }
            ]
          },
          include: { roles: true }
        });

        if (!profile) {
          log.warn({ userId }, 'No userProfile found for provider decision');
          continue;
        }

        // ne asigurăm că rolul PROVIDER există
        await ensureRole(prisma, 'PROVIDER');

        const hasProvider = profile.roles.some(r => r.name === 'PROVIDER');
        if (hasProvider) {
          log.info({ profileId: profile.id }, 'Provider role already present, skipping');
          continue;
        }

        const updated = await prisma.userProfile.update({
          where: { id: profile.id },
          data: {
            roles: {
              connect: [{ name: 'PROVIDER' }]
            }
          },
          include: { roles: true }
        });

        // audit de roluri
        await prisma.userProfileAudit.create({
          data: {
            userId: profile.id,
            actorId: evt.decidedBy ? String(evt.decidedBy) : null, // dacă trimiți decidedBy în payload
            event: 'ROLES_UPDATED',
            changedKeys: ['roles'],
            before: { roles: profile.roles.map(r => r.name) },
            after: { roles: updated.roles.map(r => r.name) }
          }
        });

        // eveniment pt AUTH: userId = authUserId
        await enqueueOutbox(prisma, OUT.USERS_ROLE_UPDATED, {
          userId: profile.authUserId,      // <- CHEIE: id-ul din auth-service
          profileId: profile.id,           // bonus info
          add: ['provider'],
          remove: [],
          at: new Date().toISOString()
        });

        log.info(
          { authUserId: profile.authUserId, profileId: profile.id },
          'Provider role added & USERS_ROLE_UPDATED enqueued'
        );
      } catch (err) {
        log.error({ err }, 'Error in providerDecided consumer');
      }
    }
  })();
}

module.exports = { registerProviderDecidedConsumer };
