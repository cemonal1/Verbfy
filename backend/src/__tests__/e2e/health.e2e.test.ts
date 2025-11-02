import request from 'supertest';
import { app } from '../../index';

describe('E2E Health Endpoints', () => {
  it('GET /health/ping returns status and uptime', async () => {
    const res = await request(app).get('/health/ping');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('uptime');
  });

  it('GET /api/health returns health report', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('monitoring');
    expect(res.body).toHaveProperty('cors');
  });
});