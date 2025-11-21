// services/users-service/src/routes/me.js
const { authMe } = require('../lib/authClient');
const path = require('path');
const fs = require('fs/promises');
const { randomUUID } = require('crypto');

module.exports = async function routes(fastify) {
  const { prisma } = fastify;

  async function ensureClientRole(prisma) {
    await prisma.role.upsert({
      where: { name: 'CLIENT' },
      update: {},
      create: { name: 'CLIENT' },
    });
  }

  async function getOrCreateProfile(authUser) {
    await ensureClientRole(prisma);

    let prof = null;

    if (authUser.id) {
      prof = await prisma.userProfile.findUnique({
        where: { authUserId: String(authUser.id) },
      });
    }
    if (!prof && authUser.email) {
      prof = await prisma.userProfile.findUnique({
        where: { email: authUser.email },
      });
    }

    if (!prof) {
      prof = await prisma.userProfile.create({
        data: {
          authUserId: String(authUser.id || randomUUID()),
          email: authUser.email || '',
          fullName:
            authUser.fullName ||
            (authUser.email
              ? authUser.email.split('@')[0]
              : 'User'),
          isActive: true,
          roles: { connect: [{ name: 'CLIENT' }] },
        },
      });
    } else {
      // dacă profilul există dar nu are roluri, conectează CLIENT
      const withRoles = await prisma.userProfile.findUnique({
        where: { id: prof.id },
        include: { roles: true },
      });
      if (!withRoles.roles || withRoles.roles.length === 0) {
        await prisma.userProfile.update({
          where: { id: prof.id },
          data: { roles: { connect: [{ name: 'CLIENT' }] } },
        });
      }
    }
    return prof;
  }

  // GET /v1/users/me
  fastify.get('/v1/users/me', async (req, reply) => {
    const cookie = req.headers.cookie || '';
    const me = await authMe(cookie);
    if (!me) return reply.unauthorized();

    const prof = await getOrCreateProfile(me);
    const withRoles = await prisma.userProfile.findUnique({
      where: { id: prof.id },
      include: { roles: true },
    });

    return {
      id: withRoles.id,
      email: withRoles.email,
      name: withRoles.fullName,
      avatarUrl: withRoles.avatarUrl || null,
      roles: (withRoles.roles || []).map((r) => r.name),
    };
  });

  // PATCH /v1/users/me
  fastify.patch('/v1/users/me', async (req, reply) => {
    const cookie = req.headers.cookie || '';
    const me = await authMe(cookie);
    if (!me) return reply.unauthorized();

    const prof = await getOrCreateProfile(me);
    const { fullName, email } = req.body || {};

    const updated = await prisma.userProfile.update({
      where: { id: prof.id },
      data: {
        ...(typeof fullName === 'string' ? { fullName } : {}),
        ...(typeof email === 'string' ? { email } : {}),
      },
      include: { roles: true },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.fullName,
      avatarUrl: updated.avatarUrl || null,
      roles: (updated.roles || []).map((r) => r.name),
    };
  });

  // POST /v1/users/me/avatar
  fastify.post('/v1/users/me/avatar', async (req, reply) => {
    const cookie = req.headers.cookie || '';
    const me = await authMe(cookie);
    if (!me) return reply.unauthorized();

    const prof = await getOrCreateProfile(me);

    const part = await req.file({ limits: { fileSize: 5 * 1024 * 1024 } });
    if (!part) return reply.badRequest('No file');

    const rel = await fastify.saveUpload(part); // /uploads/xxx.jpg
    const base =
      process.env.PUBLIC_USERS_BASE_URL ||
      `${req.protocol}://${req.headers.host}`;
    const abs = rel.startsWith('http') ? rel : `${base}${rel}`;
    await prisma.userProfile.update({
      where: { id: prof.id },
      data: { avatarUrl: abs },
    });
    return { url: abs };
  });
};
