// services/events-service/src/routes/tasks.js
import { prisma } from '../db.js';
import { createTaskSchema, updateTaskSchema } from '../validation/taskSchemas.js';
import { BadRequest, NotFound } from '../errors.js';
import { natsPublish } from '../nats.js';

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({ send: (body) => res.status(status).json(body) });
  return f;
}

export async function tasksRoutes(app) {
  app.get('/events/:id/tasks', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id: eventId } = req.params;

    const e = await prisma.event.findUnique({ where: { id: eventId } });
    if (!e) throw NotFound('Event not found');

    if (user.role !== 'admin' && e.clientId !== user.userId) {
      const isOwner = e.clientId === user.userId;
      const isParticipant = await prisma.eventParticipant.findFirst({
        where: { eventId: eventId, userId: user.userId }
      });
      if (!isOwner && !isParticipant) return res.status(403).json({ error: 'Forbidden' });
    }

    const tasks = await prisma.eventTask.findMany({ where: { eventId } });
    return reply.send(tasks);
  });

  app.post('/events/:id/tasks', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id: eventId } = req.params;

    const e = await prisma.event.findUnique({ where: { id: eventId } });
    if (!e) throw NotFound('Event not found');

    if (user.role !== 'admin' && e.clientId !== user.userId) {
      return reply.code(403).send({ error: 'Only owner/admin can add tasks' });
    }

    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) throw BadRequest('Invalid body', parsed.error.flatten());

    const t = await prisma.eventTask.create({ data: { eventId, ...parsed.data } });
    await natsPublish('task.created', { eventId, taskId: t.id, by: user.userId });
    return res.status(201).json(t);
  });

  app.put('/tasks/:taskId', async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { taskId } = req.params;

    const task = await prisma.eventTask.findUnique({ where: { id: taskId }, include: { event: true } });
    if (!task) throw NotFound('Task not found');

    const isAssigned = task.assignedTo === user.userId;
    const isOwner = task.event.clientId === user.userId;

    if (!(user.role === 'admin' || isOwner || isAssigned)) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) throw BadRequest('Invalid body', parsed.error.flatten());

    const t = await prisma.eventTask.update({ where: { id: taskId }, data: parsed.data });
    await natsPublish('task.updated', { eventId: task.eventId, taskId, by: user.userId, changes: parsed.data });
    return reply.send(t);
  });
}
