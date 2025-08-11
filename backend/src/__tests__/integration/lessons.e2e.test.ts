import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

import lessonsRoutes from '../../routes/verbfyLessons';
import authRoutes from '../../routes/auth';
import User from '../../models/User';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/verbfy-lessons', lessonsRoutes);

describe('Verbfy lessons flow', () => {
  beforeAll(async () => { if (mongoose.connection.readyState===0){ await mongoose.connect(process.env.MONGODB_URI!);} });
  afterAll(async () => { await mongoose.connection.close(); });
  beforeEach(async () => { await User.deleteMany({}); });

  it('teacher creates lesson; student starts and submits', async () => {
    const teacher = await User.create({ name:'T', email:'t@lesson.com', password: await bcrypt.hash('pass12345',10), role:'teacher', isApproved:true, approvalStatus:'approved' });
    const student = await User.create({ name:'S', email:'s@lesson.com', password: await bcrypt.hash('pass12345',10), role:'student' });
    const tLogin = await request(app).post('/api/auth/login').send({ email:'t@lesson.com', password:'pass12345' }).expect(200);
    const tCookie = tLogin.headers['set-cookie'];
    const sLogin = await request(app).post('/api/auth/login').send({ email:'s@lesson.com', password:'pass12345' }).expect(200);
    const sCookie = sLogin.headers['set-cookie'];

    const created = await request(app).post('/api/verbfy-lessons').set('Cookie', tCookie).send({
      title:'L1', description:'D', type:'VerbfyGrammar', cefrLevel:'A1', difficulty:'Beginner',
      exercises: [{ type:'multiple-choice', question:'Q', options:['A','B'], correctAnswer:'A', points:10 }]
    }).expect(201);
    const lessonId = created.body._id || created.body.data?._id;

    const started = await request(app).post(`/api/verbfy-lessons/${lessonId}/start`).set('Cookie', sCookie).expect(200);
    const attemptId = started.body.sessionId || started.body.attemptId;

    const submitted = await request(app).post(`/api/verbfy-lessons/attempt/${attemptId}/submit`).set('Cookie', sCookie).send({
      answers: [{ questionIndex:0, answer:'A' }]
    }).expect(200);
    expect(submitted.body.success ?? true).toBeTruthy();
  });
});


