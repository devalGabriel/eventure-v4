import { randomUUID } from "node:crypto";

export default async function register(fastify, ctx) {
  const { db, prefix } = ctx;

  fastify.get(`${prefix}/names`, async (req, reply) => {
    const user = (req.query?.user || "").toString().trim()
      || (req.headers["x-user-id"] || "").toString().trim();
    if (!user) return reply.code(400).send({ error: "user is required" });
    const stmt = db.prepare("SELECT id, nume, user FROM people WHERE user = ? ORDER BY id ASC");
    const rows = stmt.all(user);
    return { items: rows };
  });

  fastify.post(`${prefix}/names`, async (req, reply) => {
    const { nume, user } = req.body || {};
    if (!nume || !user) return reply.code(400).send({ error: "nume and user are required" });
    const id = randomUUID();
    db.prepare("INSERT INTO people (id, nume, user) VALUES (?, ?, ?)").run(id, String(nume), String(user));
    return { ok: true, item: { id, nume, user } };
  });
}
