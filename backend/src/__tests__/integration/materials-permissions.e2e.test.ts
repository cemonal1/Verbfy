import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

import materialsRoutes from '../../routes/materials';
import authRoutes from '../../routes/auth';
import User from '../../models/User';
import { Material } from '../../models/Material';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialsRoutes);

describe('Materials permissions', () => {
  beforeAll(async () => { if (mongoose.connection.readyState===0){ await mongoose.connect(process.env.MONGODB_URI!);} });
  afterAll(async () => { await mongoose.connection.close(); });
  beforeEach(async () => { await User.deleteMany({}); await Material.deleteMany({}); });

  it('student cannot create materials; teacher can', async () => {
    const student = await User.create({ name:'S', email:'s@test.com', password: await bcrypt.hash('pass12345',10), role:'student' });
    const teacher = await User.create({ name:'T', email:'t@test.com', password: await bcrypt.hash('pass12345',10), role:'teacher', isApproved:true, approvalStatus:'approved' });

    const sLogin = await request(app).post('/api/auth/login').send({ email:'s@test.com', password:'pass12345' }).expect(200);
    const sCookie = sLogin.headers['set-cookie'];
    await request(app).post('/api/materials').set('Cookie', sCookie).send({ title:'X' }).expect(403);

    const tLogin = await request(app).post('/api/auth/login').send({ email:'t@test.com', password:'pass12345' }).expect(200);
    const tCookie = tLogin.headers['set-cookie'];
    const created = await request(app).post('/api/materials').set('Cookie', tCookie).send({
      title:'M', description:'D', category:'grammar', cefrLevel:'A1', difficulty:'Beginner', content:'c'
    }).expect(201);
    expect(created.body.title).toBe('M');
  });

  it('only owner or admin can delete material', async () => {
    const owner = await User.create({ name:'O', email:'o@test.com', password: await bcrypt.hash('pass12345',10), role:'teacher', isApproved:true, approvalStatus:'approved' });
    const other = await User.create({ name:'X', email:'x@test.com', password: await bcrypt.hash('pass12345',10), role:'teacher', isApproved:true, approvalStatus:'approved' });
    const admin = await User.create({ name:'A', email:'a@test.com', password: await bcrypt.hash('pass12345',10), role:'admin' });

    const oLogin = await request(app).post('/api/auth/login').send({ email:'o@test.com', password:'pass12345' }).expect(200);
    const oCookie = oLogin.headers['set-cookie'];
    const mat = await request(app).post('/api/materials').set('Cookie', oCookie).send({title:'Owned', description:'', category:'grammar', cefrLevel:'A1', difficulty:'Beginner', content:'c'}).expect(201);

    const xLogin = await request(app).post('/api/auth/login').send({ email:'x@test.com', password:'pass12345' }).expect(200);
    const xCookie = xLogin.headers['set-cookie'];
    await request(app).delete(`/api/materials/${mat.body._id}`).set('Cookie', xCookie).expect(403);

    const aLogin = await request(app).post('/api/auth/login').send({ email:'a@test.com', password:'pass12345' }).expect(200);
    const aCookie = aLogin.headers['set-cookie'];
    await request(app).delete(`/api/materials/${mat.body._id}`).set('Cookie', aCookie).expect(200);
  });
});


