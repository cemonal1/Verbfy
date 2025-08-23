import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './config/db';
import { validateEnvironment } from './config/env';
import { apiLimiter, authLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { setCsrfCookie, verifyCsrf } from './middleware/csrf';
import pinoHttp from 'pino-http';
import livekitRoutes from './routes/livekitRoutes';
import authRoutes from './routes/auth';
import userRoutes from './routes/userRoutes';
import reservationRoutes from './routes/reservationRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import notificationRoutes from './routes/notificationRoutes';
import lessonMaterialRoutes from './routes/lessonMaterialRoutes';
import adminRoutes from './routes/adminRoutes';
import messagesRoutes from './routes/messages';
import analyticsRoutes from './routes/analytics';
import materialsRoutes from './routes/materials';
import chatRoutes from './routes/chat';
import paymentRoutes from './routes/payments';
import verbfyTalkRoutes from './routes/verbfyTalk';
import freeMaterialsRoutes from './routes/freeMaterials';
import verbfyLessonsRoutes from './routes/verbfyLessons';
import cefrTestsRoutes from './routes/cefrTests';
import personalizedCurriculumRoutes from './routes/personalizedCurriculum';
import aiLearningRoutes from './routes/aiLearning';
import teacherAnalyticsRoutes from './routes/teacherAnalytics';
import aiContentGenerationRoutes from './routes/aiContentGeneration';
import organizationRoutes from './routes/organization';
import rolesRoutes from './routes/roles';
import gameRoutes from './routes/gameRoutes';

// Load environment variables and initialize Sentry
dotenv.config();

// Initialize Sentry with CommonJS require
try {
  require('./instrument.js');
} catch (error: any) {
  console.warn('⚠️ Sentry initialization failed:', error?.message || 'Unknown error');
}

// Validate environment variables before starting the application
try {
  validateEnvironment();
} catch (error: any) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Initialize express and HTTP server
const app = express();
const server = createServer(app);

// Behind proxy (nginx) trust X-Forwarded-* for secure cookies and IPs
app.set('trust proxy', 1);

// Sentry init (non-blocking if DSN missing)
try {
  const Sentry = require('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.0 });
  // Support both v7 (Handlers) and guard types
  const reqHandler = Sentry.Handlers?.requestHandler?.();
  if (reqHandler) app.use(reqHandler);
} catch (error: any) {
  console.warn('⚠️ Sentry request handler not available:', error?.message || 'Unknown error');
}

// Security middleware
const isDev = process.env.NODE_ENV !== 'production';
const allowedFrames = (process.env.ALLOWED_FRAME_SRC || '').split(',').map(s => s.trim()).filter(Boolean);
const cspDirectives: any = {
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  imgSrc: ["'self'", "data:", "https:"],
  scriptSrc: isDev ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"] : ["'self'"],
  connectSrc: [
    "'self'",
    "https:",
    "wss:",
    process.env.LIVEKIT_CLOUD_URL || '',
    process.env.LIVEKIT_SELF_URL || ''
  ].filter(Boolean),
  // Allow embedding trusted frames for VerbfyGames (iframe-based games)
  frameSrc: isDev ? ["'self'", "https:", "http:", ...allowedFrames] : ["'self'", ...allowedFrames],
  objectSrc: ["'none'"]
};
app.use(helmet({
  contentSecurityPolicy: { directives: cspDirectives },
  crossOriginEmbedderPolicy: false
}));

// Relax CSP specifically for OAuth callback pages to avoid inline/CSP issues from providers
app.use('/api/auth/oauth', (req, res, next) => {
  try { res.removeHeader('Content-Security-Policy'); } catch (_) {}
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'self'; object-src 'none'");
  next();
});

// Structured logging (pretty print only in development, not in tests)
app.use(pinoHttp({
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true, singleLine: true }
  } : undefined
}));

// Serve static uploads (avatars, materials, etc.)
const uploadsRoot = path.resolve(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
  }
} catch (e) {
  console.warn('Could not ensure uploads directory exists:', e);
}
app.use('/uploads', express.static(uploadsRoot));

// Initialize Socket.IO with CORS allowing multiple origins
const socketDefaultOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
const socketExtraOrigins = (process.env.CORS_EXTRA_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const socketAllowedOrigins = [socketDefaultOrigin, ...socketExtraOrigins];

const io = new SocketIOServer(server, {
  cors: {
    origin: socketAllowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.use((socket, next) => {
  try {
    let token = (socket.handshake.auth && (socket.handshake.auth as any).token) as string | undefined;
    // Fallback to accessToken cookie if no auth token provided by client
    if (!token && typeof socket.handshake.headers?.cookie === 'string') {
      const cookieHeader = socket.handshake.headers.cookie as string;
      const parts = cookieHeader.split(';').map(p => p.trim());
      for (const part of parts) {
        if (part.startsWith('accessToken=')) {
          token = decodeURIComponent(part.substring('accessToken='.length));
          break;
        }
      }
    }
    if (!token) return next(new Error('Unauthorized'));
    const { verifyToken } = require('./utils/jwt');
    const payload = verifyToken(token);
    (socket as any).user = payload;
    next();
  } catch (e) {
    next(new Error('Unauthorized'));
  }
});

// Attach io to request for controllers that need to emit events
app.use((req, _res, next) => {
  (req as any).io = io;
  next();
});

// Connect to MongoDB
connectDB();

// Rate limiting middleware (exclude health check). Relax limits in tests to avoid flakiness
if (process.env.NODE_ENV !== 'test') {
  // Exempt OAuth dance from strict auth limiter to avoid 429 during redirects
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth/oauth')) return next();
    if (req.path.startsWith('/api/auth')) return authLimiter(req, res, next);
    return next();
  });

  app.use((req, res, next) => {
    if (req.path === '/api/health') return next();
    return apiLimiter(req, res, next);
  });
}

// CORS middleware
// Allow both apex and www domains in production
const defaultOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
const extraOrigins = (process.env.CORS_EXTRA_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const allowedOrigins = [defaultOrigin, ...extraOrigins];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Log rejected origins for debugging
    console.warn(`CORS rejected origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'x-csrf-token', 
    'X-CSRF-Token',
    'Idempotency-Key',
    'idempotency-key',
    'Accept',
    'Origin',
    'User-Agent',
    'Cache-Control'
  ],
  exposedHeaders: ['set-cookie', 'X-CSRF-Token'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CSRF: issue token cookie and header, and verify on state-changing requests in production
app.use(setCsrfCookie);
app.use(verifyCsrf);

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Enhanced health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/livekit', livekitRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/lesson-materials', lessonMaterialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/verbfy-talk', verbfyTalkRoutes);
app.use('/api/free-materials', freeMaterialsRoutes);
app.use('/api/verbfy-lessons', verbfyLessonsRoutes);
app.use('/api/cefr-tests', cefrTestsRoutes);
app.use('/api/personalized-curriculum', personalizedCurriculumRoutes);
app.use('/api/ai-learning', aiLearningRoutes);
app.use('/api/teacher-analytics', teacherAnalyticsRoutes);
app.use('/api/ai-content-generation', aiContentGenerationRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/games', gameRoutes);

// ========================================
// TEST SENTRY ENDPOINT (BURAYA!)
// ========================================
app.get('/api/test-sentry', (_req, res) => {
  try {
    // Test Sentry by capturing an error
    const Sentry = require('@sentry/node');
    if (Sentry && Sentry.captureException) {
      const testError = new Error('Test Sentry Error - Backend is working!');
      Sentry.captureException(testError);
      res.json({ 
        success: true, 
        message: 'Sentry test error captured successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Sentry not available, but endpoint is working',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    res.json({ 
      success: true, 
      message: 'Sentry test completed',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  // Get user from socket
  const user = (socket as any).user;
  if (user?.id) {
    socket.join(`user_${user.id}`);
    console.log(`👤 User ${user.id} joined notification room`);
  }

  // Handle notification room joining
  socket.on('joinNotificationRoom', (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`🔔 User ${userId} joined notification room`);
  });

  // Join a conversation room
  socket.on('joinRoom', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`👥 User ${socket.id} joined room: ${conversationId}`);
  });

  // Leave a conversation room
  socket.on('leaveRoom', (conversationId: string) => {
    socket.leave(conversationId);
    console.log(`👋 User ${socket.id} left room: ${conversationId}`);
  });

  // Handle new message
  socket.on('sendMessage', (data: { conversationId: string; message: any }) => {
    // Broadcast the message to all users in the conversation room
    socket.to(data.conversationId).emit('receiveMessage', data.message);
    console.log(`💬 Message sent in room ${data.conversationId}: ${data.message.content}`);
  });

  // Handle typing indicator
  socket.on('typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
    socket.to(data.conversationId).emit('userTyping', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// 404 handler for undefined routes
app.use('*', notFoundHandler);

// Sentry error handler (must be before global error handler)
try {
  const Sentry = require('@sentry/node');
  const errHandler = Sentry.Handlers?.errorHandler?.();
  if (errHandler) app.use(errHandler);
} catch (error: any) {
  console.warn('⚠️ Sentry error handler not available:', error?.message || 'Unknown error');
}

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`💾 Database: ${process.env.MONGO_URI ? 'Connected' : 'Not configured'}`);
  console.log(`📊 Available API Routes:`);
  console.log(`   - /api/auth (Authentication)`);
  console.log(`   - /api/users (User management)`);
  console.log(`   - /api/livekit (Video conferencing)`);
  console.log(`   - /api/reservations (Lesson booking)`);
  console.log(`   - /api/availability (Teacher availability)`);
  console.log(`   - /api/notifications (Notifications)`);
  console.log(`   - /api/materials (Learning materials - NEW)`);
  console.log(`   - /api/lesson-materials (Lesson materials - Legacy)`);
  console.log(`   - /api/admin (Admin functions)`);
  console.log(`   - /api/messages (Messaging system)`);
  console.log(`   - /api/analytics (Analytics & reports)`);
  console.log(`   - /api/chat (Real-time chat system)`);
  console.log(`🔌 Socket.IO: Enabled for real-time communication`);
});

// Export app for testing
export { app }; 