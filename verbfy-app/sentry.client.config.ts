import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn && dsn !== 'your-sentry-dsn') {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.0,
    replaysOnErrorSampleRate: 0.0,
    replaysSessionSampleRate: 0.0,
  });
}


