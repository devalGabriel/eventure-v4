import '@testing-library/jest-dom';
import 'whatwg-fetch';

// mock next/navigation pentru teste de componente
jest.mock('next/navigation', () => {
  const actual = jest.requireActual('next/navigation');
  return {
    ...actual,
    usePathname: () => '/ro',
    useRouter: () => ({ replace: jest.fn(), push: jest.fn() })
  };
});
// ✅ mock next-intl/server (evită ESM  server-only)
jest.mock('next-intl/server', () => ({
  getRequestConfig: (fn) => fn,             // passthrough
  getMessages: async () => ({}),            // dacă vrei, poți returna un obiect de test
  getTranslations: async () => ((key) => key),
  getLocale: async () => 'ro',
  setRequestLocale: () => {}
}));

// ✅ mock next/headers pentru RSC helpers (cookies etc.)
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: () => undefined,
    getAll: () => [],
    toString: () => ''       // folosit de tine în server-auth
  }),
  headers: () => new Map()
}));