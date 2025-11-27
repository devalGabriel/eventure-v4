// services/events-service/src/services/notificationsClient.js

const NOTIF_BASE =
  (process.env.NOTIFICATIONS_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_NOTIF_URL ||
    "http://localhost:4105")
    .replace(/\/$/, "");

/**
 * payload minimal:
 *  - userId: destinatar
 *  - type: string (vezi notificationTarget în UI)
 *  - title, body: texte
 *  - meta: orice JSON (eventId, invitationId, offerId, etc.)
 */
export async function sendNotification(payload) {
  if (!payload?.userId) return;

  try {
    const res = await fetch(`${NOTIF_BASE}/v1/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(
        "[events-service] notif failed:",
        res.status,
        text.slice(0, 200)
      );
    }
  } catch (e) {
    console.warn("[events-service] notif error:", e?.message || e);
  }
}
