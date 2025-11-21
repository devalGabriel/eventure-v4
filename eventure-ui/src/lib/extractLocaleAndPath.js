// helper: extrage locale + path fără locale
export function extractLocaleAndPath(pathname) {
  if (!pathname) return { locale: 'ro', path: '/' };

  const segments = pathname.split('/'); // ['', 'ro', 'dashboard', 'provider', ...]
  const locale = segments[1] || 'ro';
  const rest = '/' + segments.slice(2).join('/'); // '/dashboard/provider...'

  return { locale, path: rest || '/' };
}