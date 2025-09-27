const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.0,
  environment: process.env.NODE_ENV || 'production'
});

console.log('Sentry initialized successfully');

module.exports = Sentry;
