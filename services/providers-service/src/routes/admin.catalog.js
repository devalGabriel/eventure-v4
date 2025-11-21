// services/providers-service/src/routes/admin.catalog.js
import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';

function slugify(str) {
  return (str || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'item';
}

export default fp(async function adminCatalogRoutes(fastify, opts) {
  const requireAdmin = fastify.requireRole('ADMIN');

  //
  // CATEGORIES
  //
  fastify.post(
    '/v1/providers/catalog/categories',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const { name, slug, description, sortOrder } = request.body || {};
      if (!name) {
        return reply.code(400).send({ message: 'name is required' });
      }

      let finalSlug = slug || slugify(name);

      try {
        const category = await prisma.providerCategory.create({
          data: {
            name,
            slug: finalSlug,
            description: description || null,
            sortOrder: sortOrder ?? 0,
          },
        });

        return category;
      } catch (err) {
        fastify.log.error({ err }, 'failed to create provider category');
        return reply.code(500).send({ message: 'failed to create category' });
      }
    }
  );

  fastify.put(
    '/v1/providers/catalog/categories/:id',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const id = Number(request.params.id);
      const { name, slug, description, sortOrder, isActive } = request.body || {};

      const data = {};
      if (name !== undefined) data.name = name;
      if (slug !== undefined) data.slug = slug || slugify(name || '');
      if (description !== undefined) data.description = description;
      if (sortOrder !== undefined) data.sortOrder = sortOrder;
      if (isActive !== undefined) data.isActive = !!isActive;

      try {
        const category = await prisma.providerCategory.update({
          where: { id },
          data,
        });
        return category;
      } catch (err) {
        fastify.log.error({ err }, 'failed to update provider category');
        return reply.code(500).send({ message: 'failed to update category' });
      }
    }
  );

  // Soft-delete: doar marcăm isActive = false
  fastify.delete(
    '/v1/providers/catalog/categories/:id',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const id = Number(request.params.id);
      try {
        const category = await prisma.providerCategory.update({
          where: { id },
          data: { isActive: false },
        });
        return { ok: true, category };
      } catch (err) {
        fastify.log.error({ err }, 'failed to delete provider category');
        return reply.code(500).send({ message: 'failed to delete category' });
      }
    }
  );

  //
  // SUBCATEGORIES
  //
  fastify.post(
    '/v1/providers/catalog/subcategories',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const { categoryId, name, slug, description, sortOrder } = request.body || {};
      if (!categoryId || !name) {
        return reply.code(400).send({ message: 'categoryId and name are required' });
      }

      let finalSlug = slug || slugify(name);

      try {
        const sub = await prisma.providerSubcategory.create({
          data: {
            categoryId: Number(categoryId),
            name,
            slug: finalSlug,
            description: description || null,
            sortOrder: sortOrder ?? 0,
          },
        });
        return sub;
      } catch (err) {
        fastify.log.error({ err }, 'failed to create provider subcategory');
        return reply.code(500).send({ message: 'failed to create subcategory' });
      }
    }
  );

  fastify.put(
    '/v1/providers/catalog/subcategories/:id',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const id = Number(request.params.id);
      const { name, slug, description, sortOrder, isActive } = request.body || {};

      const data = {};
      if (name !== undefined) data.name = name;
      if (slug !== undefined) data.slug = slug || slugify(name || '');
      if (description !== undefined) data.description = description;
      if (sortOrder !== undefined) data.sortOrder = sortOrder;
      if (isActive !== undefined) data.isActive = !!isActive;

      try {
        const sub = await prisma.providerSubcategory.update({
          where: { id },
          data,
        });
        return sub;
      } catch (err) {
        fastify.log.error({ err }, 'failed to update provider subcategory');
        return reply.code(500).send({ message: 'failed to update subcategory' });
      }
    }
  );

  fastify.delete(
    '/v1/providers/catalog/subcategories/:id',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const id = Number(request.params.id);
      try {
        const sub = await prisma.providerSubcategory.update({
          where: { id },
          data: { isActive: false },
        });
        return { ok: true, subcategory: sub };
      } catch (err) {
        fastify.log.error({ err }, 'failed to delete provider subcategory');
        return reply.code(500).send({ message: 'failed to delete subcategory' });
      }
    }
  );

  //
  // TAGS
  //
  fastify.post(
    '/v1/providers/catalog/tags',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const { subcategoryId, label, slug } = request.body || {};
      if (!subcategoryId || !label) {
        return reply.code(400).send({ message: 'subcategoryId and label are required' });
      }

      const finalSlug = slug || slugify(label);

      try {
        const tag = await prisma.providerTag.create({
          data: {
            subcategoryId: Number(subcategoryId),
            label,
            slug: finalSlug,
          },
        });
        return tag;
      } catch (err) {
        fastify.log.error({ err }, 'failed to create provider tag');
        return reply.code(500).send({ message: 'failed to create tag' });
      }
    }
  );

  fastify.put(
    '/v1/providers/catalog/tags/:id',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const id = Number(request.params.id);
      const { label, slug, isActive } = request.body || {};

      const data = {};
      if (label !== undefined) data.label = label;
      if (slug !== undefined) data.slug = slug || slugify(label || '');
      if (isActive !== undefined) data.isActive = !!isActive;

      try {
        const tag = await prisma.providerTag.update({
          where: { id },
          data,
        });
        return tag;
      } catch (err) {
        fastify.log.error({ err }, 'failed to update provider tag');
        return reply.code(500).send({ message: 'failed to update tag' });
      }
    }
  );

  fastify.delete(
    '/v1/providers/catalog/tags/:id',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const id = Number(request.params.id);
      try {
        const tag = await prisma.providerTag.update({
          where: { id },
          data: { isActive: false },
        });
        return { ok: true, tag };
      } catch (err) {
        fastify.log.error({ err }, 'failed to delete provider tag');
        return reply.code(500).send({ message: 'failed to delete tag' });
      }
    }
  );
});
