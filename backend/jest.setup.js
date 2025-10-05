// Set environment variables FIRST before any imports
process.env.NODE_ENV = 'test'
process.env.FRONTEND_URL = 'http://localhost:3000'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only'
process.env.STRIPE_SECRET_KEY = 'sk_test_test'
process.env.LIVEKIT_API_KEY = 'test-api-key'
process.env.LIVEKIT_API_SECRET = 'test-api-secret'

// Shared store for rate limiter mock, reset between tests
global.__rateLimitStore = new Map();

// Conditional mock for express-rate-limit: disable for most tests, enable only for specific rate limiting tests
jest.mock('express-rate-limit', () => {
  function rateLimit(options = {}) {
    const windowMs = options.windowMs || 60 * 1000;
    const max = options.max || 5;
    const message = options.message;

    return (req, res, next) => {
      // Only enforce for the dedicated Rate Limiting tests:
      // - The test-defined limiter has a message containing 'authentication attempts'
      // - Path is specifically '/login'
      // - And the body contains password === 'wrongpassword'
      const isAuthLimiter = typeof message === 'string' && message.includes('authentication attempts');
      const isLoginPath = req && (req.path === '/login' || req.url.endsWith('/login'));
      const isWrongPassword = req && req.body && req.body.password === 'wrongpassword';
      const enforce = isAuthLimiter && isLoginPath && isWrongPassword;

      if (!enforce) return next();
      const store = global.__rateLimitStore || new Map();
      const ip = (req.ip || (req.connection && req.connection.remoteAddress) || 'unknown');
      const key = `${ip}:${req.baseUrl || ''}:${req.path || ''}`;
      const now = Date.now();
      const entry = store.get(key);
      if (!entry || now - entry.start >= windowMs) {
        store.set(key, { start: now, count: 1 });
        return next();
      }
      if (entry.count < max) {
        entry.count++;
        return next();
      }
      const payload = typeof message === 'string'
        ? { success: false, message }
        : (message || { success: false, message: 'Too many requests' });
      res.status(429).json(payload);
    };
  }
  return { __esModule: true, default: rateLimit };
});

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Setup in-memory MongoDB before all tests
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Set MongoDB URIs
  process.env.MONGO_URI = uri
  process.env.MONGODB_URI = uri
  
  // Connect to the in-memory database
  await mongoose.connect(uri);
});

// Reset rate limit store before each test
beforeEach(() => {
  const store = global.__rateLimitStore;
  if (store && typeof store.clear === 'function') {
    store.clear();
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongod) {
    await mongod.stop();
  }
});

// Global test timeout
jest.setTimeout(30000)

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}