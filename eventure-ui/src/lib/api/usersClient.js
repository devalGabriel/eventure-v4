// src/lib/api/usersClient.js
const API_BASE = '/api/admin/users';

async function handleResponse(res) {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || 'Request failed');
  }
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

// 🔹 LISTĂ USERS (admin)
export async function adminListUsers(params = {}) {
  const search = new URLSearchParams();

  if (params.role && params.role !== 'all') {
    search.set('role', params.role);
  }
  if (params.q) {
    search.set('q', params.q);
  }

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;
  search.set('page', String(page));
  search.set('pageSize', String(pageSize));

  const query = search.toString();
  const url = `${API_BASE}${query ? `?${query}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include'
  });

  return handleResponse(res);
}

// 🔹 DETALIU USER (admin)
export async function adminGetUser(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    credentials: 'include'
  });
  return handleResponse(res);
}

// 🔹 AUDIT USER
export async function adminGetUserAudit(id, params = {}) {
  const search = new URLSearchParams();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;
  search.set('page', String(page));
  search.set('pageSize', String(pageSize));

  const query = search.toString();
  const url = `${API_BASE}/${id}/audit${query ? `?${query}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include'
  });
  return handleResponse(res);
}

// 🔹 UPDATE PROFIL (nume, email, phone, locale, isActive)
export async function adminUpdateUser(id, payload) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

// 🔹 UPDATE ROLURI (ADMIN/CLIENT/PROVIDER)
export async function adminUpdateUserRoles(id, payload) {
  const res = await fetch(`${API_BASE}/${id}/roles`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}
