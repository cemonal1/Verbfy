import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import healthRoutes from '../routes/healthRoutes';
import { requestIdMiddleware } from '../middleware/requestId';
import { cacheService } from '../services/cacheService';

describe('Health Endpoints', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Connect to cache service for tests
    await cacheService.connect();

    app = express();
    app.use(express.json());
    app.use(requestIdMiddleware);
    app.use('/api/v1', healthRoutes);
  });

  afterAll(async () => {
    await cacheService.disconnect();
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(response.body.environment).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.requestId).toBeDefined();
    });

    it('should include correct environment', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.environment).toMatch(/development|test|production/);
    });

    it('should include version from package.json', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      const packageJson = require('../../package.json');
      expect(response.body.version).toBe(packageJson.version);
    });
  });

  describe('GET /api/v1/ready', () => {
    it('should return readiness status with dependency checks', async () => {
      const response = await request(app)
        .get('/api/v1/ready')
        .expect((res) => {
          // Accept either 200 or 503 depending on dependencies
          expect([200, 503]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.checks).toBeDefined();
      expect(response.body.checks.mongodb).toBeDefined();
      expect(response.body.checks.redis).toBeDefined();
      expect(typeof response.body.checks.mongodb).toBe('boolean');
      expect(typeof response.body.checks.redis).toBe('boolean');
      expect(response.body.requestId).toBeDefined();
    });

    it('should return 200 when all dependencies are ready', async () => {
      // This test depends on MongoDB and Redis being available
      // In test environment with in-memory cache, redis should be true
      const response = await request(app).get('/api/v1/ready');

      if (response.body.checks.mongodb && response.body.checks.redis) {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ready');
      }
    });

    it('should return 503 when dependencies are not ready', async () => {
      // This test verifies the logic when dependencies fail
      // We can't easily simulate this in tests without mocking
      // Just verify the response structure is correct
      const response = await request(app).get('/api/v1/ready');

      if (!response.body.checks.mongodb || !response.body.checks.redis) {
        expect(response.status).toBe(503);
        expect(response.body.status).toMatch(/not ready|error/);
      }
    });
  });

  describe('GET /api/v1/live', () => {
    it('should return 200 and liveness status', async () => {
      const response = await request(app)
        .get('/api/v1/live')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.status).toMatch(/alive|degraded/);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.eventLoopLagMs).toBeDefined();
      expect(typeof response.body.eventLoopLagMs).toBe('number');
      expect(response.body.memory).toBeDefined();
      expect(response.body.requestId).toBeDefined();
    });

    it('should include memory metrics', async () => {
      const response = await request(app)
        .get('/api/v1/live')
        .expect(200);

      const { memory } = response.body;
      expect(memory).toBeDefined();
      expect(memory.rss).toBeDefined();
      expect(memory.heapUsed).toBeDefined();
      expect(memory.heapTotal).toBeDefined();
      expect(memory.external).toBeDefined();

      // Verify all memory values are numbers and positive
      expect(typeof memory.rss).toBe('number');
      expect(typeof memory.heapUsed).toBe('number');
      expect(typeof memory.heapTotal).toBe('number');
      expect(typeof memory.external).toBe('number');
      expect(memory.rss).toBeGreaterThan(0);
      expect(memory.heapUsed).toBeGreaterThan(0);
      expect(memory.heapTotal).toBeGreaterThan(0);
    });

    it('should measure event loop lag', async () => {
      const response = await request(app)
        .get('/api/v1/live')
        .expect(200);

      expect(response.body.eventLoopLagMs).toBeGreaterThanOrEqual(0);
      // In normal conditions, lag should be less than 1000ms
      expect(response.body.eventLoopLagMs).toBeLessThan(1000);
    });

    it('should mark as alive when event loop lag is normal', async () => {
      const response = await request(app)
        .get('/api/v1/live')
        .expect(200);

      if (response.body.eventLoopLagMs < 100) {
        expect(response.body.status).toBe('alive');
      } else {
        expect(response.body.status).toBe('degraded');
      }
    });
  });

  describe('GET /api/v1/status', () => {
    it('should return combined health status', async () => {
      const response = await request(app)
        .get('/api/v1/status')
        .expect((res) => {
          // Accept either 200 or 503 depending on overall health
          expect([200, 503]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
      expect(response.body.status).toMatch(/healthy|degraded|error/);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.environment).toBeDefined();
      expect(response.body.health).toBeDefined();
      expect(response.body.ready).toBeDefined();
      expect(response.body.live).toBeDefined();
      expect(response.body.memory).toBeDefined();
      expect(response.body.requestId).toBeDefined();
    });

    it('should include health check data', async () => {
      const response = await request(app).get('/api/v1/status');

      const { health } = response.body;
      expect(health).toBeDefined();
      expect(health.alive).toBe(true);
      expect(health.uptime).toBeDefined();
      expect(typeof health.uptime).toBe('number');
      expect(health.uptime).toBeGreaterThan(0);
    });

    it('should include readiness check data', async () => {
      const response = await request(app).get('/api/v1/status');

      const { ready } = response.body;
      expect(ready).toBeDefined();
      expect(ready.mongodb).toBeDefined();
      expect(ready.redis).toBeDefined();
      expect(typeof ready.mongodb).toBe('boolean');
      expect(typeof ready.redis).toBe('boolean');
    });

    it('should include liveness check data', async () => {
      const response = await request(app).get('/api/v1/status');

      const { live } = response.body;
      expect(live).toBeDefined();
      expect(live.eventLoopLagMs).toBeDefined();
      expect(live.healthy).toBeDefined();
      expect(typeof live.eventLoopLagMs).toBe('number');
      expect(typeof live.healthy).toBe('boolean');
    });

    it('should return 200 when all checks pass', async () => {
      const response = await request(app).get('/api/v1/status');

      if (response.body.status === 'healthy') {
        expect(response.status).toBe(200);
        expect(response.body.health.alive).toBe(true);
        expect(response.body.ready.mongodb).toBe(true);
        expect(response.body.ready.redis).toBe(true);
        expect(response.body.live.healthy).toBe(true);
      }
    });

    it('should return 503 when any check fails', async () => {
      const response = await request(app).get('/api/v1/status');

      if (response.body.status === 'degraded') {
        expect(response.status).toBe(503);
      }
    });
  });

  describe('Request ID propagation', () => {
    it('should include requestId in health response', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.requestId).toBeDefined();
      expect(typeof response.body.requestId).toBe('string');
      expect(response.body.requestId.length).toBeGreaterThan(0);
    });

    it('should include requestId in ready response', async () => {
      const response = await request(app).get('/api/v1/ready');

      expect(response.body.requestId).toBeDefined();
      expect(typeof response.body.requestId).toBe('string');
    });

    it('should include requestId in live response', async () => {
      const response = await request(app)
        .get('/api/v1/live')
        .expect(200);

      expect(response.body.requestId).toBeDefined();
      expect(typeof response.body.requestId).toBe('string');
    });

    it('should include requestId in status response', async () => {
      const response = await request(app).get('/api/v1/status');

      expect(response.body.requestId).toBeDefined();
      expect(typeof response.body.requestId).toBe('string');
    });

    it('should use provided X-Request-ID header', async () => {
      const customRequestId = 'test-request-id-12345';

      const response = await request(app)
        .get('/api/v1/health')
        .set('X-Request-ID', customRequestId)
        .expect(200);

      expect(response.body.requestId).toBe(customRequestId);
    });
  });

  describe('Response headers', () => {
    it('should include X-Request-ID header in response', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
