// services/events-service/src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { prisma } from './db.js';
import { errorHandler } from './errors.js';

// routes
import { eventsRoutes } from './routes/events.js';
import { providersRoutes } from './routes/providers.js';
import { offersRoutes } from './routes/offers.js';
import { invitationsRoutes } from './routes/invitations.js';
import { tasksRoutes } from './routes/tasks.js';
import { messagesRoutes } from './routes/messages.js';
import { attachmentsRoutes } from './routes/attachments.js';
import { programsRoutes } from './routes/programs.js';
import { groupsRoutes } from './routes/groups.js';
import { eventTemplatesRoutes } from './routes/eventTemplates.js';
import { eventTypesRoutes } from './routes/eventTypes.js';
import { eventBriefBudgetRoutes } from './routes/eventBriefBudget.js';
import { assignmentsRoutes } from './routes/assignments.js';
import { adminPreContractRoutes } from './routes/adminPreContract.js';
import {eventNeedsAutoInviteRoutes} from "./routes/eventNeeds.autoInvite.js";
import eventNeedsRoutes from './routes/eventNeeds.js';
import guestbookRoutes from "./routes/guestbook.js";
import guestbookTokensRoutes from "./routes/guestbookTokens.js";
import guestbookPublicRoutes from "./routes/guestbookPublic.js";

// auth util
import { verifyAuthFactory } from './middlewares/auth.js';
import eventsBudgetRoutes from './routes/eventsBudget.js';
import eventsAiNeedsRoutes from './routes/eventsAiNeeds.js';

const PORT = Number(process.env.PORT || 4007);
const HOST = process.env.HOST || '0.0.0.0';

// NATS connect helper
async function connectNats() {
  try {
    const mod = await import('../../../libs/eventbus/index.js').catch(() => null);
    if (mod?.initEventBus) {
      const conn = await mod.initEventBus({
        url: process.env.NATS_URL || 'nats://localhost:4222',
        clientId: process.env.NATS_CLIENT_ID || 'events-service'
      });
      return conn;
    }
  } catch {}
  try {
    const { connect } = await import('nats');
    const conn = await connect({
      servers: process.env.NATS_URL || 'nats://localhost:4222',
      name: process.env.NATS_CLIENT_ID || 'events-service'
    });
    return conn;
  } catch (e) {
    console.warn('⚠️ NATS connect failed for EVENTS:', e?.message || e);
    return null;
  }
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// attach helpers
app.prisma = prisma;
app.verifyAuth = verifyAuthFactory({ prisma });

// mount routes (las eventsRoutes la tine nemodificat dacă ți-e ok)
if (eventsRoutes) eventsRoutes(app);
if (providersRoutes) providersRoutes(app);
if (offersRoutes) offersRoutes(app);
if (invitationsRoutes) invitationsRoutes(app);
if (tasksRoutes) tasksRoutes(app);
if (messagesRoutes) messagesRoutes(app);
if (attachmentsRoutes) attachmentsRoutes(app);
if (programsRoutes) programsRoutes(app);
if (groupsRoutes) groupsRoutes(app);
if (eventTemplatesRoutes) eventTemplatesRoutes(app);
if (eventBriefBudgetRoutes) eventBriefBudgetRoutes(app);
if (eventTypesRoutes) eventTypesRoutes(app);
if (assignmentsRoutes) assignmentsRoutes(app);
if (adminPreContractRoutes) adminPreContractRoutes(app);
if (eventsBudgetRoutes) eventsBudgetRoutes(app);
if (eventsAiNeedsRoutes) eventsAiNeedsRoutes(app);
if (eventNeedsAutoInviteRoutes) eventNeedsAutoInviteRoutes(app);
if (eventNeedsRoutes) eventNeedsRoutes(app);
if (guestbookRoutes) guestbookRoutes(app);
if (guestbookTokensRoutes) guestbookTokensRoutes(app);
if (guestbookPublicRoutes) guestbookPublicRoutes(app);

// health
app.get('/health', (_req, res) => res.json({ ok: true }));

// error handler
app.use(errorHandler);

let server = null;
let nats = null;

async function start() {
  nats = await connectNats();
  if (nats) {
    app.nats = nats;
    console.log('✅ NATS connected for EVENTS');
  }
  server = app.listen(PORT, HOST, () => {
    console.log(`events-service listening on http://${HOST}:${PORT}`);
  });
}

async function stop() {
  try { await nats?.drain?.(); } catch {}
  if (server) await new Promise((r) => server.close(r));
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

export { app, start, stop };
