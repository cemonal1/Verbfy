import request from 'supertest';
import { app } from '../../index';

describe('Auth email flows', () => {
  it('forgot password responds OK even for unknown email', async () => {
    const res = await request(app).post('/api/auth/password/forgot').send({ email: 'unknown@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('verify email with invalid token fails', async () => {
    const res = await request(app).get('/api/auth/verify-email/confirm').query({ token: 'invalid' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});


