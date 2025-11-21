// services/modules-service/src/index.js (ESM, robust)
import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

dotenv.config();

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 4007);
const UI_ORIGIN = process.env.UI_ORIGIN || "http://localhost:3000";

// ── rezolvăm corect root-ul local (ESM friendly)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── pregătim storage-ul, ca să nu crape fastify-static dacă nu există
const storageRoot = path.resolve(__dirname, "../storage");
const packagesDir = path.join(storageRoot, "packages");
try {
  fs.mkdirSync(packagesDir, { recursive: true });
} catch {}

const app = Fastify({ logger: true });

// ── CORS strict către UI (poți lăsa origin:true pe dev dacă vrei)
await app.register(cors, {
  origin: [UI_ORIGIN],
  credentials: true,
});

// ── static pentru /packages/* (bundle-uri de modul)
await app.register(fastifyStatic, {
  root: packagesDir,          // <— directory sigur existent
  prefix: "/packages/",       // <— important
  decorateReply: false,
  index: false,
  // constraints minime anti-listing, optional
  list: false,
});

// ── health minimal (pt. manager și monitorizare)
app.get("/healthz", async () => ({ ok: true, service: "modules-service" }));

// ── încărcăm rutele de modul DAR nu lăsăm ca o eroare aici să blocheze serverul
let routesModule;
try {
  routesModule = (await import("./routes/modules.js")).default;
} catch (e) {
  app.log.error({ err: e }, "Failed to import routes/modules.js");
}
try {
  if (typeof routesModule === "function") {
    await app.register(routesModule);
  } else if (routesModule) {
    app.log.error("routes/modules.js does not export a function; skipping register");
  } else {
    app.log.warn("routes/modules.js not loaded; server starts without it");
  }
} catch (e) {
  app.log.error({ err: e }, "Error while registering modules routes; server continues");
}

// ── pornește serverul
try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`modules-service listening on http://${HOST}:${PORT}`);
} catch (e) {
  app.log.error(e, "modules-service failed to start");
  process.exit(1);
}

// ── extra: logăm orice promisiune/eroare ne-prinsă (debug ușor)
process.on("unhandledRejection", (err) => {
  app.log.error({ err }, "unhandledRejection");
});
process.on("uncaughtException", (err) => {
  app.log.error({ err }, "uncaughtException");
});
