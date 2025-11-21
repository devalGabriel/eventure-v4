module.exports = async function routes(fastify) {
  fastify.get('/health', async () => ({ status: 'ok', service: 'notifications' }));
};
