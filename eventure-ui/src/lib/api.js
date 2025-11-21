import { mapErrorMessage } from './contracts/auth.contract';

function getCsrfToken() {
  if (typeof document === 'undefined') return null;
  const c = document.cookie.split('; ').find(c=>c.startsWith('evt_csrf='));
  return c ? decodeURIComponent(c.split('=')[1]) : null;
}

export async function httpFetch(url, opts = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    timeoutMs = 10000,
    retries = 1,
    retryOn = [502,503,504],
    locale = 'ro',
    credentials = 'include'
  } = opts;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const doFetch = async () => {
    try {
      const extra = {};
      if (['POST','PUT','PATCH','DELETE'].includes(method.toUpperCase())) {
        const t = getCsrfToken();
        if (t) extra['x-csrf-token'] = t;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type':'application/json', ...headers, ...extra },
        body: body ? JSON.stringify(body) : undefined,
        credentials,
        signal: controller.signal
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!res.ok) {
        const code = data?.code;
        const message = mapErrorMessage(code, locale);
        const error = new Error(message);
        error.status = res.status;
        error.code = code || 'UNKNOWN';
        error.details = data?.details;
        throw error;
      }
      return data;
    } catch (err) {
      const status = err?.status;
      const canRetry =
        (err?.name === 'AbortError') ||
        (status && retryOn.includes(status)) ||
        (!status && err?.message?.includes('Failed to fetch'));
      if (retries > 0 && canRetry) {
        await new Promise(r => setTimeout(r, 300 * Math.pow(2, retries-1)));
        return httpFetch(url, { ...opts, retries: retries - 1 });
      }
      throw err;
    } finally {
      clearTimeout(id);
    }
  };

  return doFetch();
}
