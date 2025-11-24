import Fastify, { fastify } from 'fastify';
import dotenv from 'dotenv';
import { logger } from './lib/logger.js';
import authPlugin from './lib/auth.js';

import healthRoutes from './routes/health.js';
import adminProvidersRoutes from './routes/admin.providers.js';
import meProfileRoutes from './routes/me.profile.js';
import meOffersRoutes from './routes/me.offers.js';
import mePackagesRoutes from './routes/me.packages.js';
import meAvailabilityRoutes from './routes/me.availability.js';
import catalogRoutes from './routes/catalog.js';
import adminCatalogRoutes from './routes/admin.catalog.js';
import meGroupsRoutes from './routes/me.groups.js';
import { meGroupMembersRoutes } from './routes/me.groupMembers.js';
import clientPackages from './routes/client.packages.js';


dotenv.config();

async function buildServer() {
  const fastify = Fastify({
    logger
  });

  await fastify.register(import('@fastify/cors'), {
    origin: true,
    credentials: true
  });

  await fastify.register(import('@fastify/helmet'), {});

  await fastify.register(authPlugin);

  // Observabilitate simplă – userId / provider în logs
  fastify.addHook('onRequest', async (req, reply) => {
    if (req.headers.authorization) {
      try {
        await fastify.authenticate(req, reply);
        req.log = req.log.child({
          userId: req.user?.id,
          roles: req.user?.roles
        });
      } catch {
        // nu blocăm /health, /catalog etc.
      }
    }
  });

  // Rute
  await fastify.register(healthRoutes);
  await fastify.register(catalogRoutes);
  await fastify.register(adminProvidersRoutes);
  await fastify.register(meProfileRoutes);
  await fastify.register(meOffersRoutes);
  await fastify.register(mePackagesRoutes);
  await fastify.register(meAvailabilityRoutes);
  await fastify.register(adminCatalogRoutes);
  await fastify.register(meGroupsRoutes);
  await fastify.register(meGroupMembersRoutes, {prefix: '/api'})
  await fastify.register(clientPackages, {prefix: '/api'})

  fastify.get('/', async () => ({
    service: 'providers-service',
    status: 'ok'
  }));

  return fastify;
}

const port = Number(process.env.SERVICE_PORT || 4004);
const host = process.env.SERVICE_HOST || '0.0.0.0';

buildServer()
  .then((fastify) => {
    fastify.listen({ port, host }, (err, address) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
      fastify.log.info({ address }, 'providers-service listening');
    });
  })
  .catch((err) => {
    console.log({ err }, 'Failed to start providers-service');
    process.exit(1);
  });
