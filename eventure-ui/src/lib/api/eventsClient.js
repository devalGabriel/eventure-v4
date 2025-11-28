// src/lib/api/eventsClient.js
export async function getEventRequestDetail(eventId, invitationId) {
  const res = await fetch(`/api/events/${eventId}/invitations/${invitationId}`, {
    cache: "no-store",
  });
  const txt = await res.text();
  if (!res.ok) {
    throw new Error(txt || `Failed to load request with status ${res.status}`);
  }
  return txt ? JSON.parse(txt) : null;
}

// src/lib/api/eventsClient.js
export async function getEventMessages(eventId) {
  const res = await fetch(`/api/events/${eventId}/messages`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load messages for event ${eventId}`);
  return res.json();
}

export async function postEventMessage(eventId, body) {
  const res = await fetch(`/api/events/${eventId}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`Failed to send event message`);
  return res.json();
}

export async function getOfferMessages(offerId) {
  const res = await fetch(`/api/offers/${offerId}/messages`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load messages for offer ${offerId}`);
  return res.json();
}

export async function postOfferMessage(offerId, body) {
  const res = await fetch(`/api/offers/${offerId}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`Failed to send offer message`);
  return res.json();
}

export async function markNotificationsReadContext({ eventId, offerId }) {
  const res = await fetch('/api/notifications/mark-read-context', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ context: { eventId, offerId } }),
  });
  if (!res.ok) return { updated: 0 };
  return res.json();
}
