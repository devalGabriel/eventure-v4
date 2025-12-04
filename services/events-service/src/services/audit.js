    // services/events-service/src/services/audit.js
import { logger } from "../logger.js";

/**
 * Helper simplu de audit pentru acțiunile critice din fluxul
 * de pre-contract (invitații, oferte).
 *
 * Nu aruncă excepții – dacă logging-ul eșuează, aplicația merge mai departe.
 */
export function auditEvent(event, payload = {}) {
  try {
    logger.info({
      type: "events.audit",
      event,
      ...payload,
    });
  } catch (err) {
    // nu stricăm business logic-ul pentru un log nereușit
    try {
      // eslint-disable-next-line no-console
      console.warn("auditEvent failed", event, err);
    } catch {
      // ignore
    }
  }
}
