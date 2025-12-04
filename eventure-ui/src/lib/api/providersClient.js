// src/lib/api/providersClient.js
'use client';

const API_BASE = '/api/providers';
const API_BASE_ME_OFFERS = "/api/providers/me/offers";
const API_BASE_ME_PACKAGES = "/api/providers/me/packages";

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  return res.json();
}

// --- Provider self ---

export async function getMyProviderProfile() {
  const res = await fetch(`${API_BASE}/me/profile`, {
    method: 'GET',
    credentials: 'include'
  });
  return handleResponse(res);
}

export async function updateMyProviderProfile(payload) {
  const res = await fetch(`${API_BASE}/me/profile`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

// --- servicii (oferte) ---

export async function getMyServiceOffers() {
  const res = await fetch(`${API_BASE}/me/offers`, {
    method: 'GET',
    credentials: 'include'
  });
  return handleResponse(res);
}

export async function createServiceOffer(payload) {
  const res = await fetch(`${API_BASE}/me/offers`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function updateServiceOffer(id, payload) {
  const res = await fetch(`${API_BASE}/me/offers/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function deleteServiceOffer(id) {
  const res = await fetch(`${API_BASE_ME_OFFERS}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res);
}

// --- pachete ---

export async function getMyPackages() {
  const res = await fetch(`${API_BASE}/me/packages`, {
    method: 'GET',
    credentials: 'include'
  });
  return handleResponse(res);
}

export async function createPackage(payload) {
  const res = await fetch(`${API_BASE}/me/packages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function updatePackage(id, payload) {
  const res = await fetch(`${API_BASE}/me/packages/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function deletePackage(id) {
  const res = await fetch(`${API_BASE_ME_PACKAGES}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res);
}

// --- disponibilitate ---

export async function getMyAvailability() {
  const res = await fetch(`${API_BASE}/me/availability`, {
    method: 'GET',
    credentials: 'include'
  });
  return handleResponse(res);
}

export async function updateMyAvailability(blocks) {
  const res = await fetch(`${API_BASE}/me/availability`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks })
  });
  return handleResponse(res);
}

// --- catalog pentru provider (read-only) ---
export async function getProviderCatalog() {
  const res = await fetch('/api/providers/catalog', { credentials: "include" });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : data.categories || [];
}

// --- Provider Groups ---

export async function getMyProviderGroups() {
  const res = await fetch(`${API_BASE}/me/groups`, {
    method: 'GET',
    credentials: 'include'
  });
  return handleResponse(res);
}

export async function createProviderGroup(payload) {
  const res = await fetch(`${API_BASE}/me/groups`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function updateProviderGroup(id, payload) {
  const res = await fetch(`${API_BASE}/me/groups/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

// căutare membri pentru grupuri (pe profil)
export async function searchGroupMembers(params = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.city) search.set('city', params.city);
  if (params.tagId) search.set('tagId', String(params.tagId));
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);

  const query = search.toString();
  const url = `/api/providers/me/group-members/search${query ? `?${query}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include'
  });
  return handleResponse(res);
}

// 🔹 NOI – servicii ale unui provider (pentru membri de grup)
// ✅ nou – aduce ServiceOffer, nu pachete
export async function getProviderServices(providerProfileId) {
  const search = new URLSearchParams();
  if (providerProfileId) {
    search.set("providerProfileId", String(providerProfileId));
  }
  const query = search.toString();

  const url = `/api/providers/me/group-members/services${
    query ? `?${query}` : ""
  }`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(res);
}


// --- Admin ---

export async function adminListProviders(params = {}) {
  const search = new URLSearchParams();

  if (params.status && params.status !== "undefined") {
    search.set("status", params.status);
  }
  if (params.watchlistOnly && params.watchlistOnly !== "undefined") {
    search.set("watchlistOnly", params.watchlistOnly);
  }
  if (params.city && params.city !== "undefined") {
    search.set("city", params.city);
  }
  if (params.q && params.q !== "undefined") {
    search.set("q", params.q);
  }

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;
  search.set("page", String(page));
  search.set("pageSize", String(pageSize));

  const query = search.toString();
  const url = `${API_BASE}/admin${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse(res);
}

export async function adminGetProviderById(id) {
  const res = await fetch(`${API_BASE}/admin/${id}`, {
    method: 'GET',
    credentials: 'include'
  });
  return handleResponse(res);
}

export async function adminUpdateProvider(id, payload) {
  const res = await fetch(`${API_BASE}/admin/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

// NOTĂ: acum folosim BFF-ul Next, nu direct providers-service

export async function adminListProviderAdminNotes(providerId) {
  const res = await fetch(`/api/admin/providers/${providerId}/admin-notes`, {
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Failed to load admin notes (${res.status})`);
  }
  return JSON.parse(text); // array
}

export async function adminCreateProviderAdminNote(providerId, { note }) {
  const res = await fetch(`/api/admin/providers/${providerId}/admin-notes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ note }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Failed to create admin note (${res.status})`);
  }
  return JSON.parse(text);
}

// --- Admin catalog ---

export async function adminGetProviderCatalog() {
  const res = await fetch(`${API_BASE}/admin/catalog/categories`, {
    method: 'GET',
    credentials: 'include'
  });
  return handleResponse(res);
}

export async function adminCreateProviderCategory(payload) {
  const res = await fetch(`${API_BASE}/admin/catalog/categories`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function adminUpdateProviderCategory(id, payload) {
  const res = await fetch(`${API_BASE}/admin/catalog/categories/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function adminDeleteProviderCategory(id) {
  const res = await fetch(`${API_BASE}/admin/catalog/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return handleResponse(res);
}

export async function adminCreateProviderSubcategory(payload) {
  const res = await fetch(`${API_BASE}/admin/catalog/subcategories`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function adminUpdateProviderSubcategory(id, payload) {
  const res = await fetch(`${API_BASE}/admin/catalog/subcategories/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function adminDeleteProviderSubcategory(id) {
  const res = await fetch(`${API_BASE}/admin/catalog/subcategories/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return handleResponse(res);
}

export async function adminCreateProviderTag(payload) {
  const res = await fetch(`${API_BASE}/admin/catalog/tags`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function adminUpdateProviderTag(id, payload) {
  const res = await fetch(`${API_BASE}/admin/catalog/tags/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function adminDeleteProviderTag(id) {
  const res = await fetch(`${API_BASE}/admin/catalog/tags/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return handleResponse(res);
}

export async function providerGetProfile() {
  const res = await fetch('/api/providers/me/profile', {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function providerUpdateProfile(payload) {
  const res = await fetch('/api/providers/me/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function leaveProviderGroupMembership(membershipId) {
  const res = await fetch(
    `/api/providers/me/groups/memberships/${membershipId}/leave`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    let msg = 'Eroare la părăsirea grupului';
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch (e) {
      // ignore
    }
    throw new Error(msg);
  }

  return res.json();
}

export async function getMatchedProvidersForNeed(need, brief) {
  const r = await fetch(`/api/providers/internal/match-need`, {
    method: "POST",
    body: JSON.stringify({ need, eventBrief: brief }),
  });
  if (!r.ok) throw new Error("Failed match providers");
  return r.json();
}