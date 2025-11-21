import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { pathToFileURL } from "node:url";

export function pkgBase(storageDir, slug, version) {
  return path.join(storageDir, "packages", slug, version);
}
export function dbPathFor(storageDir, slug) {
  const dir = path.join(storageDir, "packages", slug);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "data.sqlite");
}
export function runSqlMigrations(dbFile, migrationsFile) {
  const db = new Database(dbFile);
  const sql = fs.readFileSync(migrationsFile, "utf8");
  db.exec(sql);
  db.close();
}
export async function mountBackend(fastify, { slug, backend }, baseDir, dbFile) {
  if (!backend?.entry) return;
  const entryAbs = path.join(baseDir, backend.entry);
  const mod = await import(pathToFileURL(entryAbs).href);
  const prefix = `/mod/${slug}`;
  const db = new Database(dbFile);
  const ctx = { db, prefix, fastify };
  if (typeof mod.default === "function") {
    await mod.default(fastify, ctx);
    fastify.log.info({ slug, prefix }, "backend mounted");
  } else {
    fastify.log.warn({ slug }, "backend.js has no default export function");
  }
}
