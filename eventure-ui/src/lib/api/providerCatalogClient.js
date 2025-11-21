// src/lib/api/providerCatalogClient.js

function handleResponseError(res, body) {
  const msg =
    body && typeof body === 'object' && body.message
      ? body.message
      : `Request failed with status ${res.status}`;
  const err = new Error(msg);
  err.status = res.status;
  err.payload = body;
  return err;
}

async function handleResponse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore, keep raw text
    data = text;
  }
  if (!res.ok) {
    throw handleResponseError(res, data);
  }
  return data;
}

// GET arbore complet (categorii + subcategorii + taguri)
export async function getProviderCatalog() {
  const res = await fetch('/api/providers/catalog', {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(res);
}

// --- ADMIN ops ---

export async function adminCreateCategory(payload) {
  const res = await fetch('/api/admin/providers/catalog/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminUpdateCategory(id, payload) {
  const res = await fetch(`/api/admin/providers/catalog/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminDeleteCategory(id) {
  const res = await fetch(`/api/admin/providers/catalog/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function adminCreateSubcategory(payload) {
  const res = await fetch('/api/admin/providers/catalog/subcategories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminUpdateSubcategory(id, payload) {
  const res = await fetch(`/api/admin/providers/catalog/subcategories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminDeleteSubcategory(id) {
  const res = await fetch(`/api/admin/providers/catalog/subcategories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function adminCreateTag(payload) {
  const res = await fetch('/api/admin/providers/catalog/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminUpdateTag(id, payload) {
  const res = await fetch(`/api/admin/providers/catalog/tags/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminDeleteTag(id) {
  const res = await fetch(`/api/admin/providers/catalog/tags/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res);
}
