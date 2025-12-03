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

export async function getRecommendedNeeds(eventId) {
  const r = await fetch(`/api/events/${eventId}/recommended-needs`, {
    cache: "no-store",
  });
  if (!r.ok) throw new Error("Failed AI needs");
  return r.json();
}

export async function autoInviteProviders(
  eventId,
  needId,
  strategy = "top",
  limit = 5
) {
  const r = await fetch(
    `/api/events/${eventId}/needs/${needId}/auto-invite`,
    {
      method: "POST",
      headers: { "content-type": "application/json" }, // 🔴 important
      body: JSON.stringify({ strategy, limit }),
    }
  );
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    console.error("autoInviteProviders failed:", r.status, txt);
    throw new Error("Failed auto-invite");
  }
  return r.json();
}

export async function getBudgetAnalysis(eventId) {
  const r = await fetch(`/api/events/${eventId}/budget-analysis`, {
    method: "GET",
    cache: "no-store",
  });
  if (!r.ok) throw new Error("Failed budget analysis");
  return r.json();
}

export async function getGapsAnalysis(eventId) {
  const r = await fetch(`/api/events/${eventId}/gaps-analysis`, {
    method: "GET",
    cache: "no-store",
  });
  if (!r.ok) throw new Error("Failed gaps analysis");
  return r.json();
}

export async function getGuestbook(eventId) {
  const r = await fetch(`/api/events/${eventId}/guestbook`, {
    cache: "no-store",
  });
  const txt = await r.text();
  if (!r.ok) {
    throw new Error(txt || `Failed to load guestbook (${r.status})`);
  }
  return txt ? JSON.parse(txt) : [];
}

export async function postGuestbookEntry(eventId, { authorName, message }) {
  const r = await fetch(`/api/events/${eventId}/guestbook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ authorName, message }),
  });
  const txt = await r.text();
  if (!r.ok) {
    throw new Error(txt || `Failed to post guestbook entry (${r.status})`);
  }
  return txt ? JSON.parse(txt) : null;
}

export async function deleteGuestbookEntry(eventId, entryId) {
  const r = await fetch(`/api/events/${eventId}/guestbook/${entryId}`, {
    method: "DELETE",
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(txt || `Failed to delete guestbook entry (${r.status})`);
  }
  return true;
}

// admin/owner
export async function getGuestbookTokens(eventId) {
  const r = await fetch(`/api/events/${eventId}/guestbook/tokens`, {
    cache: "no-store",
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(txt || "Failed guestbook tokens");
  return txt ? JSON.parse(txt) : [];
}

export async function createGuestbookToken(eventId, payload) {
  const r = await fetch(`/api/events/${eventId}/guestbook/tokens`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(txt || "Failed create guestbook token");
  return txt ? JSON.parse(txt) : null;
}

// public
export async function getPublicGuestbook(token) {
  const r = await fetch(`/api/guestbook/public/${token}`, {
    cache: "no-store",
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(txt || "Failed load public guestbook");
  return txt ? JSON.parse(txt) : null;
}

export async function postPublicGuestbookMessage(token, { authorName, message }) {
  const r = await fetch(`/api/guestbook/public/${token}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ authorName, message }),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(txt || "Failed post public guestbook message");
  return txt ? JSON.parse(txt) : null;
}

// --- Guestbook intern (owner/admin) ---
export async function getEventGuestbook(eventId) {
  const r = await fetch(`/api/events/${eventId}/guestbook`, {
    cache: "no-store",
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(txt || "Failed event guestbook");
  return txt ? JSON.parse(txt) : null;
}

// --- Participanți eveniment (pentru tokenuri PARTICIPANT) ---
export async function getEventParticipants(eventId) {
  const r = await fetch(`/api/events/${eventId}/participants`, {
    cache: "no-store",
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(txt || "Failed event participants");
  return txt ? JSON.parse(txt) : [];
}
