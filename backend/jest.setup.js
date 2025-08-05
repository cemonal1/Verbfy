// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://localhost:27017/verbfy-test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only'
process.env.STRIPE_SECRET_KEY = 'sk_test_test'
process.env.LIVEKIT_API_KEY = 'test-api-key'
process.env.LIVEKIT_API_SECRET = 'test-api-secret'

// Global test timeout
jest.setTimeout(10000)

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} 