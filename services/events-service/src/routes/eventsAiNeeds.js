// services/events-service/src/routes/eventsAiNeeds.js
import { recommendEventNeeds } from "../lib/aiNeeds.js";
import { ensureEventOwnerOrAdmin } from "../services/eventsAccess.js";

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({
    send: (body) => res.status(status).json(body),
  });
  return f;
}

export default function eventsAiNeedsRoutes(app) {
  // GET /events/:id/recommended-needs
  app.get("/events/:id/recommended-needs", async (req, res) => {
    const reply = makeReply(res);
    const user = await app.verifyAuth(req);
    const { id } = req.params;

    const ev = await ensureEventOwnerOrAdmin(user, id, reply);
    if (!ev) return;

    try {
      const recommendations = await recommendEventNeeds(ev);
      return reply.send(recommendations);
    } catch (err) {
      console.error("recommended-needs error:", err);
      return reply
        .code(500)
        .send({ error: "Failed to compute recommended needs" });
    }
  });
}
