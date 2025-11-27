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
