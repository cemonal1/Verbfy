import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/userRoutes';
import reservationRoutes from './routes/reservationRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import lessonMaterialRoutes from './routes/lessonMaterialRoutes';
import adminRoutes from './routes/adminRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { errorHandler } from './middleware/errorHandler';
import { setupSocketServer } from './socketServer';
import UserModel from './models/User';
import { Reservation } from './models/Reservation';

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS configuration: restrict in production, allow all in development
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigin = isProd ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:3000';
const corsOptions = {
  origin: allowedOrigin,
  credentials: true, // allow cookies/auth headers
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    socketIO: 'enabled'
  });
});

// JWT test endpoint
app.get('/api/test-jwt', (req, res) => {
  try {
    const { signAccessToken, verifyToken } = require('./utils/jwt');
    
    // Test token generation
    const testPayload = { id: 'test123', name: 'Test User', email: 'test@example.com', role: 'student' };
    const testToken = signAccessToken(testPayload);
    
    // Test token verification
    const decoded = verifyToken(testToken);
    
    res.json({
      message: 'JWT test successful',
      originalPayload: testPayload,
      generatedToken: testToken.substring(0, 20) + '...',
      decodedPayload: decoded,
      jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
      jwtSecretPreview: process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NOT FOUND'
    });
  } catch (error: any) {
    console.error('JWT test error:', error);
    res.status(500).json({
      message: 'JWT test failed',
      error: error.message,
      jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
      jwtSecretPreview: process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NOT FOUND'
    });
  }
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    // Test User model
    const userCount = await UserModel.countDocuments();
    
    // Test Reservation model
    const reservationCount = await Reservation.countDocuments();
    
    res.json({
      message: 'Database connection test',
      userCount,
      reservationCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    res.status(500).json({
      message: 'Database test failed',
      error: error.message
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/materials', lessonMaterialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handler
app.use(errorHandler);

// Setup Socket.IO server
setupSocketServer(server);

const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log('Backend running on port', PORT);
  });
};

startServer(); 