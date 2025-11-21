import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import Ajv from "ajv";
import fs from "node:fs";
import path from "node:path";
import { extractZipTo, ensureDir, fileExists, readJson, rmrf, join, resolve } from "../lib/zip.js";
import { pkgBase, dbPathFor, runSqlMigrations, mountBackend } from "../lib/runtime.js";

const ajv = new Ajv({ allErrors: true });

const manifestSchema = {
  type: "object",
  required: ["name", "slug", "version", "type"],
  properties: {
    name: { type: "string" },
    slug: { type: "string", pattern: "^[a-z0-9-]+$" },
    version: { type: "string" },
    type: { type: "string", enum: ["ui", "backend", "full"] },
    entryClient: { type: "string" },
    ui: { type: "object" },
    backend: {
      type: "object",
      properties: { entry: { type: "string" }, migrations: { type: "string" } },
      additionalProperties: true
    },
    configSchema: { type: "object" }
  },
  additionalProperties: true
};

export default fp(async function routes(fastify) {
  const prisma = new PrismaClient();
  const STORAGE = resolve("storage");
  ensureDir(STORAGE);

  fastify.get("/modules", async () => {
    const modules = await prisma.module.findMany({ orderBy: { createdAt: "desc" } });
    return { modules };
  });

  fastify.get("/modules/by-slug/:slug", async (req, reply) => {
    const { slug } = req.params;
    const m = await prisma.module.findUnique({ where: { slug } });
    if (!m) return reply.code(404).send({ error: "Not found" });
    return { id: m.id, slug: m.slug, manifest: m.manifest };
  });

  fastify.register(import("@fastify/multipart")).after(() => {
    fastify.post("/modules/install", async (req, reply) => {
      const file = await req.file();
      if (!file) return reply.code(400).send({ error: "file missing" });
      const buf = await file.toBuffer();

      const tmp = join(STORAGE, "tmp", `${Date.now()}-${Math.random().toString(16).slice(2)}`);
      ensureDir(tmp);
      extractZipTo(buf, tmp);

      const manifestPath = join(tmp, "manifest.json");
      if (!fileExists(manifestPath)) return reply.code(400).send({ error: "manifest.json missing" });
      const manifest = readJson(manifestPath);

      const validate = ajv.compile(manifestSchema);
      if (!validate(manifest)) return reply.code(400).send({ error: "invalid manifest", details: validate.errors });

      // copiem pachetul
      const base = pkgBase(STORAGE, manifest.slug, manifest.version);
      ensureDir(base);
      fs.cpSync(tmp, base, { recursive: true });

      // salvăm entryClient RELATIV pentru import în UI
      const resolvedManifest = { ...manifest };
      if (resolvedManifest.entryClient?.startsWith("./")) {
        resolvedManifest.entryClient = `/packages/${manifest.slug}/${manifest.version}/${resolvedManifest.entryClient.replace(/^\.\//, "")}`;
      }

      // upsert în registry
      const saved = await prisma.module.upsert({
        where: { slug: manifest.slug },
        update: {
          name: manifest.name,
          version: manifest.version,
          type: manifest.type,
          entryClient: resolvedManifest.entryClient ?? null,
          manifest: resolvedManifest
        },
        create: {
          name: manifest.name,
          slug: manifest.slug,
          version: manifest.version,
          type: manifest.type,
          entryClient: resolvedManifest.entryClient ?? null,
          manifest: resolvedManifest
        }
      });

      // DB + backend
      const dbFile = dbPathFor(STORAGE, manifest.slug);
      if (manifest.backend?.migrations) {
        const migAbs = path.join(base, manifest.backend.migrations);
        runSqlMigrations(dbFile, migAbs);
      }
      if (manifest.backend?.entry) {
        await mountBackend(fastify, { slug: manifest.slug, backend: manifest.backend }, base, dbFile);
      }

      rmrf(tmp);
      return { ok: true, module: saved };
    });
  });

  // SLUG actions
  fastify.post("/modules/slug/:slug/enable", async (req, reply) => {
    const { slug } = req.params;
    const m = await prisma.module.update({ where: { slug }, data: { enabled: true } });
    return { ok: true, module: m };
  });
  fastify.post("/modules/slug/:slug/disable", async (req, reply) => {
    const { slug } = req.params;
    const m = await prisma.module.update({ where: { slug }, data: { enabled: false } });
    return { ok: true, module: m };
  });
  fastify.delete("/modules/slug/:slug", async (req, reply) => {
    const { slug } = req.params;
    const m = await prisma.module.findUnique({ where: { slug } });
    if (!m) return reply.code(404).send({ error: "Not found" });
    await prisma.module.delete({ where: { slug } });
    try { fs.rmSync(path.join(STORAGE, "packages", m.slug, m.version), { recursive: true, force: true }); } catch {}
    return { ok: true };
  });
  fastify.get("/modules/slug/:slug/config", async (req, reply) => {
    const { slug } = req.params;
    const m = await prisma.module.findUnique({ where: { slug } });
    if (!m) return reply.code(404).send({ error: "Not found" });
    return { config: m.config, schema: m.manifest?.configSchema || null };
  });
  fastify.put("/modules/slug/:slug/config", async (req, reply) => {
    const { slug } = req.params;
    const body = req.body ?? {};
    const m = await prisma.module.update({ where: { slug }, data: { config: body } });
    return { ok: true, config: m.config };
  });

  // remount la boot
  fastify.ready(async () => {
    const list = await prisma.module.findMany();
    for (const m of list) {
      try {
        if (m.manifest?.backend?.entry) {
          const base = pkgBase(STORAGE, m.slug, m.version);
          const dbFile = dbPathFor(STORAGE, m.slug);
          await mountBackend(fastify, { slug: m.slug, backend: m.manifest.backend }, base, dbFile);
        }
      } catch (e) { fastify.log.error(e, `failed to mount backend for ${m.slug}`); }
    }
  });
});
