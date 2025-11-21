// services/auth-service/src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

import internalRoutes from './routes/internalRoutes.js';
import { registerRoleConsumer } from './subscribers/rolesConsumer.js';
import { registerProfileConsumer } from './subscribers/profileConsumer.js';

const PORT = Number(process.env.PORT || 4001);
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// --- app ---
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// routes
app.use('/auth', authRoutes);
app.use('/internal', internalRoutes);

// error handler (ultimul)
app.use(errorHandler);

// --- NATS connect (helper din monorepo sau fallback la pachetul oficial) ---
let nats = null;
async function connectNats() {
  // 1) helper monorepo (dacă există)
  try {
    const mod = await import('../../../libs/eventbus/index.js').catch(() => null);
    if (mod?.initEventBus) {
      const conn = await mod.initEventBus({
        url: process.env.NATS_URL || 'nats://localhost:4222',
        clientId: process.env.NATS_CLIENT_ID || 'auth-service'
      });
      return conn;
    }
  } catch {}
  // 2) fallback
  try {
    const { connect } = await import('nats');
    const conn = await connect({
      servers: process.env.NATS_URL || 'nats://localhost:4222',
      name: process.env.NATS_CLIENT_ID || 'auth-service'
    });
    return conn;
  } catch (e) {
    console.warn('⚠️ NATS connect failed for AUTH:', e?.message || e);
    return null;
  }
}

let server = null;
async function start() {
  nats = await connectNats();
  if (nats) {
    app.set('nats', nats);
    console.log('✅ NATS connected for AUTH');
    registerRoleConsumer(nats, console);
    registerProfileConsumer(nats, console); 
  }

  server = app.listen(PORT, HOST, () => {
    console.log(`auth-service listening on http://${HOST}:${PORT}`);
  });
}

async function stop() {
  try { await nats?.drain?.(); } catch {}
  if (server) await new Promise((r) => server.close(r));
}

if (NODE_ENV !== 'test') {
  start();
}

export { app, start, stop };
