// middleware.js
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

// ---- i18n ------------------------------------------
const locales = ['ro', 'en'];
const defaultLocale = 'ro';
const intl = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always' // => redirectează / -> /ro
});

// ---- Role routing rules -----------------------------
const ROLE_ROUTES = [
  { prefix: 'admin',    roles: ['admin'] },
  { prefix: 'offers',   roles: ['provider'] },             // panou provider
  { prefix: 'provider', roles: ['provider', 'admin'] },    // dacă folosești /provider/*
  { prefix: 'events',   roles: ['client', 'admin'] },      // panou client
  { prefix: 'users',    roles: ['admin'] },
  { prefix: 'dashboard', roles: ['client', 'provider', 'admin'] },
  { prefix: 'profile',   roles: ['client', 'provider', 'admin'] }
];

// ---- Helpers ----------------------------------------
function isExcluded(pathname) {
  // exclude: next internals, static assets, API
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets') ||
    /\.[a-zA-Z0-9]+$/.test(pathname) // orice fișier cu extensie
  );
}

function roleFor(req) {
  // până legăm AUTH real, rolul vine din cookie (provizoriu)
  return req.cookies.get('evt_role')?.value || 'client';
}

function ensureCsrf(res, req) {
  const has = req.cookies.get('evt_csrf')?.value;
  if (!has) {
    const array = new Uint8Array(16);
    globalThis.crypto.getRandomValues(array);
    const token = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    res.headers.append('set-cookie', `evt_csrf=${token}; Path=/; SameSite=Lax; Secure`);
  }
}

function setSecurityHeaders(res) {
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  res.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
}

// ---- Main middleware --------------------------------
export function middleware(req) {
  const { pathname } = req.nextUrl;

  // 0) Excluderi — nu aplicăm i18n/guards pentru aceste rute
  if (isExcluded(pathname)) {
    return NextResponse.next();
  }

  // 1) Lăsăm next-intl să gestioneze LOCALE + redirect / -> /ro
  const intlResp = intl(req);

  // Dacă next-intl a decis un REDIRECT (ex: / -> /ro), îl returnăm imediat
  if (intlResp.type === 'redirect') {
    setSecurityHeaders(intlResp);
    ensureCsrf(intlResp, req);
    return intlResp;
  }

  // 2) Determinăm URL-ul "efectiv" după rewrite-ul next-intl (dacă există)
  // next-intl poate seta x-middleware-rewrite; îl folosim ca sursă a adevărului
  const rewriteTarget = intlResp.headers.get('x-middleware-rewrite');
  const effectiveUrl = new URL(rewriteTarget ?? req.url);
  const parts = effectiveUrl.pathname.split('/').filter(Boolean);

  // parts: [locale, prefix, ...]
  const locale = parts[0] || defaultLocale;
  const prefix = parts[1] || '';

  // 3) Role guards pe prefix (admin/offers/events/etc.)
  const route = ROLE_ROUTES.find(r => r.prefix === prefix);
  if (route) {
    const currentRole = roleFor(req);
    if (!route.roles.includes(currentRole)) {
      const redirectTo = `/${locale}/dashboard`;
      const deny = NextResponse.redirect(new URL(redirectTo, req.url));
      setSecurityHeaders(deny);
      ensureCsrf(deny, req);
      return deny;
    }
  }

  // 4) Rute protejate simple: cerem sesiune minimă
  const protectedPrefixes = new Set(['dashboard', 'profile', 'users', 'offers', 'events']);
  if (protectedPrefixes.has(prefix)) {
    const hasSession = req.cookies.get('evt_session')?.value;
    if (!hasSession) {
      const nextParam = encodeURIComponent(effectiveUrl.pathname + effectiveUrl.search);
      const to = `/${locale}/login?next=${nextParam}`;
      const redir = NextResponse.redirect(new URL(to, req.url));
      setSecurityHeaders(redir);
      ensureCsrf(redir, req);
      return redir;
    }
  }

  // 5) Adăugăm headere de securitate + CSRF pe răspunsul next-intl
  setSecurityHeaders(intlResp);
  ensureCsrf(intlResp, req);
  return intlResp;
}

// Matcher: aplicăm pe TOT ce nu e asset /map/HTML/etc.
export const config = {
  matcher: ['/((?!_next|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|map|html|css|js)).*)']
};
