import * as Sentry from '@sentry/node';

export const initMonitoring = () => {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
      integrations: [
        // Basic integrations only
      ],
      beforeSend(event) {
        // Filter out sensitive data
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
    });

    console.log('✅ Sentry monitoring initialized');
  } else {
    console.log('⚠️ Sentry monitoring disabled (missing SENTRY_DSN or not in production)');
  }
};

// Performance monitoring helpers
export const capturePerformance = (name: string, operation: () => Promise<any>) => {
  return Sentry.startSpan({ name, op: 'function' }, async () => {
    return await operation();
  });
};

export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setTag(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
};

// Database performance monitoring
export const monitorDatabaseQuery = (queryName: string, query: () => Promise<any>) => {
  return capturePerformance(`db.${queryName}`, query);
};