import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import authRoutes from '../../routes/auth';
import User from '../../models/User';
import VerificationToken from '../../models/VerificationToken';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('Email verification and password reset', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
  });
  afterAll(async () => { await mongoose.connection.close(); });
  beforeEach(async () => { await User.deleteMany({}); await VerificationToken.deleteMany({}); });

  it('verifies email using token', async () => {
    const user = await User.create({ name: 'U', email: 'u@test.com', password: await bcrypt.hash('pass12345',10), role: 'student', isActive: false });
    // simulate token creation
    const vt = await VerificationToken.create({ userId: user._id, token: 'tok', expiresAt: new Date(Date.now()+60000) });
    const res = await request(app).post('/api/auth/verify-email').send({ token: 'tok' }).expect(200);
    expect(res.body.success).toBe(true);
  });

  it('resets password with valid token', async () => {
    const user = await User.create({ name: 'U', email: 'r@test.com', password: await bcrypt.hash('oldpass123',10), role: 'student' });
    const vt = await VerificationToken.create({ userId: user._id, token: 'rtok', expiresAt: new Date(Date.now()+60000) });
    const res = await request(app).post('/api/auth/password/reset').send({ token: 'rtok', password: 'newpass123' }).expect(200);
    expect(res.body.success).toBe(true);
  });
});


