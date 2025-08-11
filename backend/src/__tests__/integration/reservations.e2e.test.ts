import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

import reservationRoutes from '../../routes/reservationRoutes';
import authRoutes from '../../routes/auth';
import availabilityRoutes from '../../routes/availabilityRoutes';
import User from '../../models/User';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/reservations', reservationRoutes);

describe('Reservation booking and conflicts', () => {
  beforeAll(async () => { if (mongoose.connection.readyState===0){ await mongoose.connect(process.env.MONGODB_URI!);} });
  afterAll(async () => { await mongoose.connection.close(); });
  beforeEach(async () => { await User.deleteMany({}); });

  it('student can book available slot; conflict prevented', async () => {
    const teacher = await User.create({ name:'T', email:'t@resv.com', password: await bcrypt.hash('pass12345',10), role:'teacher', isApproved:true, approvalStatus:'approved' });
    const student = await User.create({ name:'S', email:'s@resv.com', password: await bcrypt.hash('pass12345',10), role:'student' });

    const tLogin = await request(app).post('/api/auth/login').send({ email:'t@resv.com', password:'pass12345' }).expect(200);
    const tCookie = tLogin.headers['set-cookie'];
    // Teacher sets availability (assuming endpoint: POST /api/availability)
    await request(app).post('/api/availability').set('Cookie', tCookie).send({
      dayOfWeek: new Date().getDay(),
      startTime: '10:00',
      endTime: '12:00'
    }).expect(201);

    const sLogin = await request(app).post('/api/auth/login').send({ email:'s@resv.com', password:'pass12345' }).expect(200);
    const sCookie = sLogin.headers['set-cookie'];

    const booking = await request(app).post('/api/reservations/reserve').set('Cookie', sCookie).send({
      teacherId: teacher._id,
      date: new Date().toISOString().slice(0,10),
      startTime: '10:30', endTime: '11:00', lessonType:'General', lessonLevel:'A1'
    }).expect(201);
    expect(booking.body.success ?? true).toBeTruthy();

    // Attempt conflict booking
    await request(app).post('/api/reservations/reserve').set('Cookie', sCookie).send({
      teacherId: teacher._id,
      date: new Date().toISOString().slice(0,10),
      startTime: '10:45', endTime: '11:15', lessonType:'General', lessonLevel:'A1'
    }).expect(400);
  });
});


