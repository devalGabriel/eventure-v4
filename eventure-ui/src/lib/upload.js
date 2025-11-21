function getCsrfToken() {
  if (typeof document === 'undefined') return null;
  const c = document.cookie.split('; ').find(c=>c.startsWith('evt_csrf='));
  return c ? decodeURIComponent(c.split('=')[1]) : null;
}

export async function httpUpload(url, file, field='file', extraFields={}, { timeoutMs=20000 } = {}) {
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), timeoutMs);

  try {
    const fd = new FormData();
    fd.append(field, file);
    Object.entries(extraFields).forEach(([k,v]) => fd.append(k, v));

    const headers = {};
    const csrf = getCsrfToken();
    if (csrf) headers['x-csrf-token'] = csrf;

    const res = await fetch(url, {
      method:'POST',
      body: fd,
      headers,
      credentials:'include',
      signal: controller.signal
    });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
    return data;
  } finally {
    clearTimeout(id);
  }
}

export async function changePassword(url, { oldPassword, newPassword }) {
  const headers = { 'Content-Type':'application/json' };
  const csrf = getCsrfToken();
  if (csrf) headers['x-csrf-token'] = csrf;

  const res = await fetch(url, {
    method:'POST',
    headers,
    body: JSON.stringify({ oldPassword, newPassword }),
    credentials:'include'
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}
