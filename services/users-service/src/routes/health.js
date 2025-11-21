async function routes(fastify) {
  fastify.get('/health', async () => ({ ok: true, service: 'users-service', ts: Date.now() }));
}
module.exports = routes;
