// services/users-service/src/plugins/upload.js
const fp = require('fastify-plugin');
const path = require('path');
const fs = require('fs/promises');

module.exports = fp(async (fastify) => {
  // multipart compatibil cu Fastify v4
  await fastify.register(require('@fastify/multipart'), {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  });

  // pregătește folderul de upload
  const uploadsDir = path.join(__dirname, '../../uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  // utilitar simplu de salvare (NU înregistrează static aici!)
  fastify.decorate('saveUpload', async (part) => {
    const ext = path.extname(part.filename || '').toLowerCase() || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const target = path.join(uploadsDir, name);

    const buf = await part.toBuffer(); // disponibil în @fastify/multipart v7
    await fs.writeFile(target, buf);

    return `/uploads/${name}`;
  });
});
