import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

import adminRoutes from '../../routes/adminRoutes';
import authRoutes from '../../routes/auth';
import materialsRoutes from '../../routes/materials';
import User from '../../models/User';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/materials', materialsRoutes);

describe('Admin logs retrieval', () => {
  beforeAll(async () => { if (mongoose.connection.readyState===0){ await mongoose.connect(process.env.MONGODB_URI!);} });
  afterAll(async () => { await mongoose.connection.close(); });
  beforeEach(async () => { await User.deleteMany({}); });

  it('admin can fetch logs with pagination', async () => {
    const admin = await User.create({ name:'Admin', email:'admin@logs.com', password: await bcrypt.hash('pass12345',10), role:'admin' });
    const aLogin = await request(app).post('/api/auth/login').send({ email:'admin@logs.com', password:'pass12345' }).expect(200);
    const aCookie = aLogin.headers['set-cookie'];
    const res = await request(app).get('/api/admin/logs?page=1&limit=10').set('Cookie', aCookie).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('logs');
    expect(res.body.data).toHaveProperty('pagination');
  });
});


