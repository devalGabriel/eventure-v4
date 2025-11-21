const logger = require('./logger');

async function enqueueOutbox(prisma, topic, payload) {
  await prisma.outboxEvent.create({
    data: { topic, payload }
  });
}

async function publishPending(fastify, limit = 50) {
  const { prisma, nats } = fastify;
  const events = await prisma.outboxEvent.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: limit
  });

  for (const evt of events) {
    try {
      await nats.publish(evt.topic, Buffer.from(JSON.stringify(evt.payload)));
      await prisma.outboxEvent.update({
        where: { id: evt.id },
        data: { status: 'PUBLISHED', publishedAt: new Date(), attempts: { increment: 1 } }
      });
    } catch (err) {
      logger.error({ err, id: evt.id, topic: evt.topic }, 'Outbox publish failed');
      await prisma.outboxEvent.update({
        where: { id: evt.id },
        data: { status: 'FAILED', attempts: { increment: 1 } }
      });
    }
  }
}

module.exports = { enqueueOutbox, publishPending };
