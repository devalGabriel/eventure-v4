// services/events-service/src/routes/eventNeeds.autoInvite.js
import { prisma } from "../db.js";
import { ensureEventOwnerOrAdmin } from "../services/eventsAccess.js";

const PROVIDERS_URL =
  process.env.PROVIDERS_URL || "http://localhost:4004/v1";

function makeReply(res) {
  const f = (body) => res.json(body);
  f.send = (body) => res.json(body);
  f.code = (status) => ({
    send: (body) => res.status(status).json(body),
  });
  return f;
}

export function eventNeedsAutoInviteRoutes(app) {
  // POST /events/:eventId/needs/:needId/auto-invite
  app.post("/events/:eventId/needs/:needId/auto-invite", async (req, res) => {
    console.log("[auto-invite] request received");
    const reply = makeReply(res);

    try {
      const user = await app.verifyAuth(req);
      const { eventId, needId } = req.params;
      const body = req.body || {};

      const strategyRaw = body.strategy || body.mode || "all";
      const strategy = String(strategyRaw).toLowerCase();
      const topLimit = Number(body.limit) || 5;

      const ev = await ensureEventOwnerOrAdmin(user, eventId, reply);
      if (!ev) return;

      const need = await prisma.eventNeed.findUnique({
        where: { id: needId },
      });

      if (!need || need.eventId !== ev.id) {
        return reply.code(404).send({ error: "Need not found for this event" });
      }

      // Context pentru matching
      const context = {
        eventId: ev.id,
        eventType: ev.type || ev.eventType || null,
        city: ev.city || null,
        guestCount: ev.guestCount || null,
        date: ev.date || null,
      };

      // 1. chemăm providers-service -> /internal/match-need
      let matchRes;
      try {
        console.log(
          "[auto-invite] calling providers-service:",
          `${PROVIDERS_URL}/v1/internal/match-need`
        );

        matchRes = await fetch(`${PROVIDERS_URL}/v1/internal/match-need`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ need, context }),
        });
      } catch (err) {
        console.error(
          "auto-invite: providers-service unreachable",
          err?.message,
          err?.cause
        );
        return reply
          .code(502)
          .send({ error: "providers-service not reachable", detail: err?.message });
      }

      if (!matchRes.ok) {
        const txt = await matchRes.text().catch(() => "");
        console.error(
          "auto-invite: providers-service error",
          matchRes.status,
          txt
        );
        return reply.code(502).send({
          error: "providers-service error for match-need",
          status: matchRes.status,
          detail: txt,
        });
      }

      let matchData;
      try {
        matchData = await matchRes.json();
      } catch (err) {
        console.error("auto-invite: invalid JSON from providers-service", err);
        return reply.code(502).send({
          error: "Invalid JSON from providers-service match-need",
        });
      }

      const providers = Array.isArray(matchData?.providers)
        ? matchData.providers
        : Array.isArray(matchData)
        ? matchData
        : [];

      if (!providers.length) {
        return reply.send({
          createdCount: 0,
          skippedCount: 0,
          totalCandidates: 0,
        });
      }

      let selected = providers;
      if (strategy === "top") {
        selected = providers.slice(0, topLimit);
      }

      const providerIds = selected
        .map((p) => String(p.userId || p.id))
        .filter(Boolean);

      // verificăm care au deja invitație pe acest eveniment + need
      const existing = await prisma.eventInvitation.findMany({
        where: {
          eventId: ev.id,
          needId: need.id,
          providerId: { in: providerIds },
        },
        select: { providerId: true },
      });

      const existingSet = new Set(existing.map((e) => String(e.providerId)));

      const toCreateProviderIds = providerIds.filter(
        (id) => !existingSet.has(id)
      );

      if (!toCreateProviderIds.length) {
        return reply.send({
          createdCount: 0,
          skippedCount: providerIds.length,
          totalCandidates: providers.length,
        });
      }

      const createData = toCreateProviderIds.map((pid) => ({
        eventId: ev.id,
        clientId: ev.clientId,
        providerId: pid,
        note: null,
        message: null,
        roleHint: need.label || null,
        replyDeadline: null,
        needId: need.id,
        proposedBudget: need.budgetPlanned ?? null,
        budgetCurrency: ev.currency || null,
      }));

      const result = await prisma.eventInvitation.createMany({
        data: createData,
        skipDuplicates: true,
      });

      return reply.send({
        createdCount: result.count ?? createData.length,
        skippedCount: providerIds.length - toCreateProviderIds.length,
        totalCandidates: providers.length,
      });
    } catch (err) {
      console.error("auto-invite: unexpected internal error", err);
      return reply.code(500).send({
        error: "Internal auto-invite error",
        detail: err?.message,
      });
    }
  });
}
