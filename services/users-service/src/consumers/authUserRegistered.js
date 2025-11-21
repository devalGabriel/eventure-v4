// services/users-service/src/consumers/authUserRegistered.js
const logger = require('../lib/logger');
const { IN } = require('../lib/events');

async function registerAuthConsumer(fastify) {
  const { nats, prisma } = fastify;
  const sub = nats.subscribe(IN.AUTH_USER_REGISTERED);

  (async () => {
    for await (const m of sub) {
      try {
        const data = JSON.parse(m.data.toString());
        const rawAuthId = data?.authUserId;
        const authUserId = rawAuthId !== undefined && rawAuthId !== null ? String(rawAuthId) : null;
        const { email, fullName } = data;

        if (!authUserId || !email) {
          logger.warn({ data }, 'Invalid auth.user.registered payload');
          continue;
        }

        await prisma.userProfile.upsert({
          where: { authUserId },         // ✅ string
          update: {},
          create: {
            authUserId,                  // ✅ string
            email,
            fullName: fullName || email.split('@')[0],
            roles: { connect: [{ name: 'CLIENT' }] } // default
          }
        });

        logger.info({ email }, 'UserProfile created from AUTH event');
      } catch (err) {
        logger.error({ err }, 'Error handling auth.user.registered');
      }
    }
  })();
}

module.exports = { registerAuthConsumer };
