// src/lib/monitor.js
export async function captureException(err, context) {
  if (typeof window !== 'undefined') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureException(err, { extra: context });
  } else {
    // server side lazy import
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureException(err, { extra: context });
  }
}
