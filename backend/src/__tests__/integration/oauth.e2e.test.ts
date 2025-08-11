import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../../routes/auth';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('OAuth endpoints smoke tests', () => {
  const originalEnv = { ...process.env };
  afterEach(() => { process.env = { ...originalEnv }; });

  it('returns 501 when provider is not configured (init)', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    const res = await request(app).get('/api/auth/oauth/google').expect(501);
    expect(res.body.success).toBe(false);
  });

  it('returns close script with 501 when provider is not configured (callback)', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    const res = await request(app).get('/api/auth/oauth/google/callback').expect(501);
    expect(res.text).toContain('window.close');
  });
});


