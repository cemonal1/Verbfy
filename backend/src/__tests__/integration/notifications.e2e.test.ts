import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import notificationRoutes from '../../routes/notificationRoutes';
import authRoutes from '../../routes/auth';
import User from '../../models/User';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

describe('Notifications basic flow', () => {
  beforeAll(async () => { if (mongoose.connection.readyState===0){ await mongoose.connect(process.env.MONGODB_URI!);} });
  afterAll(async () => { await mongoose.connection.close(); });
  beforeEach(async () => { await User.deleteMany({}); });

  it('returns unread count and allows mark-all-as-read', async () => {
    const u = await User.create({ name:'N', email:'n@test.com', password: await bcrypt.hash('pass12345',10), role:'student' });
    const login = await request(app).post('/api/auth/login').send({ email:'n@test.com', password:'pass12345' }).expect(200);
    const cookie = login.headers['set-cookie'];
    const list = await request(app).get('/api/notifications').set('Cookie', cookie).expect(200);
    expect(list.body.success ?? true).toBeTruthy();
    const unread = await request(app).get('/api/notifications/unread-count').set('Cookie', cookie).expect(200);
    expect((unread.body.data?.unreadCount ?? unread.body.unreadCount) >= 0).toBe(true);
    await request(app).patch('/api/notifications/read-all').set('Cookie', cookie).expect(200);
  });
});


