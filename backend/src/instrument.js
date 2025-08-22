const Sentry = require("@sentry/node");

// Initialize Sentry with CommonJS syntax
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.0,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    // Add any specific integrations if needed
  ]
});

console.log('✅ Sentry initialized successfully with CommonJS');

module.exports = Sentry;
