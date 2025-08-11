import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';

import authRoutes from '../../routes/auth';
import adminRoutes from '../../routes/adminRoutes';
import userRoutes from '../../routes/userRoutes';
import User from '../../models/User';

// Minimal app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

describe('Auth + Teacher approval flow', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('registers a teacher as pending, admin approves, then login yields teacher role', async () => {
    // Create admin
    const admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: await bcrypt.hash('pass12345', 10), role: 'admin' });

    // Register teacher
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Teach', email: 'teach@test.com', password: 'pass12345', role: 'teacher' })
      .expect(201);

    expect(reg.body.success).toBe(true);
    const teacher = await User.findOne({ email: 'teach@test.com' }).lean();
    expect(teacher?.approvalStatus).toBe('pending');

    // Admin approves
    const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'pass12345' }).expect(200);
    const adminCookie = adminLogin.headers['set-cookie'];
    await request(app)
      .patch(`/api/admin/teachers/${teacher!._id}/approve`)
      .set('Cookie', adminCookie)
      .expect(200);

    const updated = await User.findById(teacher!._id).lean();
    expect(updated?.isApproved).toBe(true);
    expect(updated?.approvalStatus).toBe('approved');

    // Teacher logs in; should get full teacher role
    const tLogin = await request(app).post('/api/auth/login').send({ email: 'teach@test.com', password: 'pass12345' }).expect(200);
    expect(tLogin.body.success).toBe(true);
    expect(tLogin.body.user.role).toBe('teacher');
  });
});


