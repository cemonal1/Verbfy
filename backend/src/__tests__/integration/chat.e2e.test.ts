import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

import chatRoutes from '../../routes/chat';
import authRoutes from '../../routes/auth';
import User from '../../models/User';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

describe('Chat basic flow', () => {
  beforeAll(async () => { if (mongoose.connection.readyState===0){ await mongoose.connect(process.env.MONGODB_URI!);} });
  afterAll(async () => { await mongoose.connection.close(); });
  beforeEach(async () => { await User.deleteMany({}); });

  it('creates conversation and sends/reads messages', async () => {
    const teacher = await User.create({ name:'T', email:'t@chat.com', password: await bcrypt.hash('pass12345',10), role:'teacher', isApproved:true, approvalStatus:'approved' });
    const student = await User.create({ name:'S', email:'s@chat.com', password: await bcrypt.hash('pass12345',10), role:'student' });

    const tLogin = await request(app).post('/api/auth/login').send({ email:'t@chat.com', password:'pass12345' }).expect(200);
    const tCookie = tLogin.headers['set-cookie'];
    const sLogin = await request(app).post('/api/auth/login').send({ email:'s@chat.com', password:'pass12345' }).expect(200);
    const sCookie = sLogin.headers['set-cookie'];

    // Create/get conversation
    const conv = await request(app).get(`/api/chat/conversations/user/${teacher._id}`).set('Cookie', sCookie).expect(200);
    const convId = conv.body.data?._id || conv.body._id || conv.body.conversation?._id;
    expect(convId).toBeTruthy();

    // Send message from student
    const msg = await request(app).post('/api/chat/messages').set('Cookie', sCookie).send({ conversationId: convId, content:'Hello', messageType:'text' }).expect(201);
    expect(msg.body.success ?? true).toBeTruthy();

    // Teacher fetches messages and marks as read
    const list = await request(app).get(`/api/chat/conversations/${convId}/messages`).set('Cookie', tCookie).expect(200);
    expect(Array.isArray(list.body.data?.messages || list.body.messages)).toBe(true);
    await request(app).patch(`/api/chat/conversations/${convId}/read`).set('Cookie', tCookie).expect(200);
  });
});


