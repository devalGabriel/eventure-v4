import { httpFetch } from './api';
import { AUTH_ENDPOINTS, USERS_ENDPOINTS } from './contracts/auth.contract';
import { httpUpload, changePassword as changePw } from './upload';

const API_AUTH  = (process.env.NEXT_PUBLIC_AUTH_URL  || 'http://localhost:4001').replace(/\/$/, '');
const API_USERS = (process.env.NEXT_PUBLIC_USERS_URL || 'http://localhost:4102').replace(/\/$/, '');

export async function signIn({ email, password }, locale='ro') {
  return httpFetch(`${API_AUTH}${AUTH_ENDPOINTS.SIGN_IN}`, {
    method: 'POST', body: { email, password }, locale, retries: 1
  });
}

// ✅ Citește user-ul autentificat direct din AUTH (folosește cookies httpOnly)
export async function currentUserAuth(locale='ro') {
  // GET /auth/me – nu trimitem body; httpFetch include credențiale și cookie-urile
  return httpFetch(`${API_USERS}/v1/users/me`, { locale, retries: 0 });
}

export async function signUp({ name, email, password }, locale='ro') {
  return httpFetch(`${API_AUTH}${AUTH_ENDPOINTS.SIGN_UP}`, {
    method: 'POST', body: { name, email, password }, locale, retries: 1
  });
}

export async function forgotPassword({ email }, locale='ro') {
  return httpFetch(`${API_AUTH}${AUTH_ENDPOINTS.FORGOT}`, {
    method: 'POST', body: { email }, locale, retries: 1
  });
}

// export async function currentUser(locale='ro') {
//   return httpFetch(`${API_USERS}${USERS_ENDPOINTS.ME}`, { locale, retries: 0 });
// }
export async function currentUser(locale='ro') {
  // până expunem /v1/users/me în users-service, luăm profilul din AUTH
  return httpFetch(`${API_USERS}/v1/users/me`, { locale, retries: 0 });
}

export async function updateMe({ name, email }, locale='ro') {
  return httpFetch(`${API_USERS}/v1/users/me`, {
    method: 'PATCH',
    body: { fullName: name, email },
    locale,
    retries: 0
  });
}

export async function uploadAvatar(file) {
  const form = new FormData();
  form.append('avatar', file);
  const res = await fetch(`${API_USERS}/v1/users/me/avatar`, {
    method: 'POST',
    body: form,
    credentials: 'include'
  });
  if (!res.ok) throw new Error(`Upload failed ${res.status}`);
  return res.json(); // {url}
}

export async function changePassword({ oldPassword, newPassword }) {
  return changePw(`${API_USERS}/users/change-password`, { oldPassword, newPassword });
}

export async function signOut(locale='ro') {
  await httpFetch(`${API_AUTH}/auth/logout`, { method: 'POST', locale, retries: 0 });
  if (typeof window !== 'undefined') {
    window.__evt_roles = [];
    window.dispatchEvent(new CustomEvent('evt:roles-set'));
    window.location.href = `/${locale}/login`;
  }
}