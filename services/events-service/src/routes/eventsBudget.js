// services/events-service/src/routes/eventsBudget.js
import { computeBudgetAnalysis } from "../lib/budgetEngine.js";
import { computeGaps } from "../lib/gapsEngine.js";
import { ensureEventOwnerOrAdmin } from "../services/eventsAccess.js";

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({
    send: (body) => res.status(status).json(body),
  });
  return f;
}

export default function eventsBudgetRoutes(app) {
  // GET /events/:id/budget-analysis
  app.get("/events/:id/budget-analysis", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!ev) return;

    try {
      const result = await computeBudgetAnalysis(id);
      return reply.send(result);
    } catch (err) {
      console.error("budget-analysis error:", err);
      return reply.code(500).send({ error: "Budget analysis failed" });
    }
  });

  // GET /events/:id/gaps-analysis
  app.get("/events/:id/gaps-analysis", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!ev) return;

    try {
      const result = await computeGaps(id);
      return reply.send(result);
    } catch (err) {
      console.error("gaps-analysis error:", err);
      return reply.code(500).send({ error: "Gaps analysis failed" });
    }
  });
}
