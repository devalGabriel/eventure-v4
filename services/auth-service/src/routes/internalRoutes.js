// services/auth-service/src/routes/internalRoutes.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * POST /internal/users/:id/force-logout
 * Șterge toate refresh tokens pentru user -> forțează reautentificarea
 */
router.post('/users/:id/force-logout', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.refreshToken.deleteMany({ where: { userId: Number(id) || id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'internal error' });
  }
});

export default router;
