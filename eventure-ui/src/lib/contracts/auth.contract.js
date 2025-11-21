/**
 * Contract UI <-> AUTH/USERS (v0.1)
 *
 * AUTH SERVICE (http://localhost:4001)
 *  - POST /auth/sign-in
 *      Req: { email: string, password: string }
 *      Res: { ok: true }  // Setează cookie httpOnly: evt_session
 *      Errors:
 *        400 { code:'ERR_VALIDATION', details:{...} }
 *        401 { code:'ERR_INVALID_CREDENTIALS' }
 *        429 { code:'ERR_RATE_LIMIT' }
 *
 *  - POST /auth/sign-up
 *      Req: { name: string, email: string, password: string }
 *      Res: { ok: true } // + cookie evt_session
 *      Errors:
 *        400 { code:'ERR_VALIDATION', details:{...} }
 *        409 { code:'ERR_EMAIL_EXISTS' }
 *
 *  - POST /auth/forgot-password
 *      Req: { email:string }
 *      Res: { ok: true }
 *      Errors:
 *        400 { code:'ERR_VALIDATION' }
 *        404 { code:'ERR_NOT_FOUND' }  // email inexistent (opțional return 200)
 *
 * USERS SERVICE (http://localhost:4002)
 *  - GET /users/me
 *      Res: { id:string, name:string, email:string, roles:string[] }
 *      Errors:
 *        401 { code:'ERR_UNAUTHORIZED' }
 */

export const AUTH_ENDPOINTS = {
  SIGN_IN: '/auth/sign-in',
  SIGN_UP: '/auth/sign-up',
  FORGOT:  '/auth/forgot-password'
};

export const USERS_ENDPOINTS = {
  ME: '/users/me'
};

// Map erori -> mesaje UI (RO/EN pot fi mutate în i18n la nevoie)
export const ERROR_MAP = {
  ERR_INVALID_CREDENTIALS: { ro: 'Email sau parolă incorecte.', en: 'Invalid email or password.' },
  ERR_EMAIL_EXISTS:        { ro: 'Contul există deja.',         en: 'Email already registered.' },
  ERR_RATE_LIMIT:          { ro: 'Prea multe încercări. Reîncearcă mai târziu.', en: 'Too many attempts. Try later.' },
  ERR_UNAUTHORIZED:        { ro: 'Autentificare necesară.',     en: 'Authentication required.' },
  ERR_NOT_FOUND:           { ro: 'Nu a fost găsit.',            en: 'Not found.' },
  ERR_VALIDATION:          { ro: 'Date invalide. Verifică formularul.', en: 'Invalid data. Check the form.' },
  DEFAULT:                 { ro: 'Eroare neașteptată.',         en: 'Unexpected error.' }
};

/** Returnează mesaj UI pentru codul de eroare backend. */
export function mapErrorMessage(code, locale='ro') {
  const k = ERROR_MAP[code] || ERROR_MAP.DEFAULT;
  return k[locale] || k.ro;
}
