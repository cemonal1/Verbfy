import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: 0.1, // Capture 10% of transactions
  
  // Session replay for debugging
  replaysSessionSampleRate: 0.1, // Capture 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
  
  // Filter out sensitive data
  beforeSend(event) {
    // Remove sensitive headers and data
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    return event;
  },
  
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});