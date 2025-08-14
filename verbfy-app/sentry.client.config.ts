import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  tracesSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.0,
  replaysSessionSampleRate: 0.0,
});


