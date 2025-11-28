// services/events-service/src/services/notificationsClient.js

const NOTIF_BASE =
  (process.env.NOTIFICATIONS_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_NOTIF_URL ||
    'http://localhost:4105')
    .replace(/\/$/, '');

/**
 * payload minimal (din events-service):
 *  - userId: destinatar (authUserId din AUTH/USERS)
 *  - type: string (ex. 'EVENT_MESSAGE', 'EVENT_OFFER_DECIDED')
 *  - title, body: texte
 *  - meta: orice JSON (eventId, invitationId, offerId, assignmentId, etc.)
 *
 * Acest helper adaptează payload-ul la schema notifications-service:
 *  POST /internal/notify  { authUserId, title, body, data, type }
 */
export async function sendNotification(payload) {
  if (!payload || !payload.userId) return;

  const { userId, type, title, body, meta } = payload;

  const apiBody = {
    authUserId: String(userId),
    title: String(title || '').trim(),
    body: String(body || '').trim(),
    data: meta || {},
    type: type || 'SYSTEM',
  };

  if (!apiBody.title || !apiBody.body) return;

  try {
    const res = await fetch(`${NOTIF_BASE}/internal/notify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(apiBody),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // nu aruncăm, doar logăm – notificările nu trebuie să spargă flow-ul principal
      console.warn(
        '[events-service] notif failed:',
        res.status,
        text.slice(0, 200),
      );
    }
  } catch (e) {
    console.warn('[events-service] notif error:', e?.message || e);
  }
}
