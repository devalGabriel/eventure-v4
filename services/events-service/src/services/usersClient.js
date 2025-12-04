// services/events-service/src/services/usersClient.js

const USERS_URL = process.env.USERS_URL || "http://localhost:4102/v1";

/**
 * POST /internal/users/bulk
 * Body: { ids: string[] }
 * Răspuns așteptat: [{ id, email, name?, displayName?, fullName?, phone? }, ...]
 */
export async function fetchUsersByIds(ids = []) {
  const clean = Array.from(
    new Set(
      (ids || [])
        .map((id) => (id == null ? null : String(id).trim()))
        .filter(Boolean)
    )
  );
  if (!clean.length) return {};

  try {
    const res = await fetch(`${USERS_URL}/internal/users/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: clean }),
    });

    if (!res.ok) {
      console.error("usersClient.fetchUsersByIds failed:", res.status);
      return {};
    }

    const data = await res.json();
    if (!Array.isArray(data)) return {};

    const map = {};
    for (const u of data) {
      if (!u || !u.id) continue;
      map[String(u.id)] = u;
    }
    return map;
  } catch (err) {
    console.error("usersClient.fetchUsersByIds error", err);
    return {};
  }
}

/**
 * POST /internal/users/lookup
 * Body: { email?, phone? }
 * Răspuns așteptat: { id, email, name?/displayName?/fullName?, phone? } sau null
 *
 * Folosit la:
 *  - creare participant din email/telefon
 */
export async function lookupUserByEmailOrPhone({ email, phone } = {}) {
  const payload = {};
  if (email) payload.email = String(email).trim();
  if (phone) payload.phone = String(phone).trim();

  if (!payload.email && !payload.phone) return null;

  try {
    const res = await fetch(`${USERS_URL}/internal/users/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("usersClient.lookupUserByEmailOrPhone failed:", res.status);
      return null;
    }

    const data = await res.json();
    if (!data || !data.id) return null;
    return data;
  } catch (err) {
    console.error("usersClient.lookupUserByEmailOrPhone error", err);
    return null;
  }
}
