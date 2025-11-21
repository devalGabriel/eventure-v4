// services/users-service/src/routes/roles.js
const { userIdParam, roleMutationBody } = require('../lib/validators');
const { enqueueOutbox } = require('../lib/outbox');
const { OUT } = require('../lib/events');
const { mapUser } = require('../lib/dto');

async function routes(fastify) {
  const { prisma } = fastify;

  fastify.patch('/v1/users/:id/roles', async (req, reply) => {
    const { id } = userIdParam.parse(req.params);
    const { add = [], remove = [] } = roleMutationBody.parse(req.body);

    const before = await prisma.userProfile.findUnique({
      where: { id },
      include: { roles: true }
    });
    if (!before) return reply.notFound('User not found');

    const connect = add.map((name) => ({ name }));
    const disconnect = remove.map((name) => ({ name }));

    const updated = await prisma.userProfile.update({
      where: { id },
      data: {
        roles: {
          ...(connect.length ? { connect } : {}),
          ...(disconnect.length ? { disconnect } : {})
        }
      },
      include: { roles: true }
    });

    await prisma.userProfileAudit.create({
      data: {
        userId: id,
        actorId: req.headers['x-actor-id']?.toString() || null,
        event: 'ROLES_UPDATED',
        changedKeys: ['roles'],
        before: { roles: before.roles.map((r) => r.name) },
        after: { roles: updated.roles.map((r) => r.name) }
      }
    });

    // OUTBOX → AUTH (rolesConsumer)
    await enqueueOutbox(prisma, OUT.USERS_ROLE_UPDATED, {
      userId: before.authUserId,          // id din auth-service
      profileId: id,                      // UUID profil
      add,
      remove,
      at: new Date().toISOString()
    });

    return mapUser(updated);
  });
}

module.exports = routes;
