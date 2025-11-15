import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { initMonitoring } from './config/monitoring';
import { createServer } from 'http';
import * as path from 'path';
import * as fs from 'fs';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { connectDB } from './config/db';
import { validateEnvironment } from './config/env';
import { cacheService } from './services/cacheService';
import { apiLimiter, authLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { setCsrfCookie, verifyCsrf } from './middleware/csrf';
import pinoHttp from 'pino-http';
import UserModel from './models/User';
import { VerbfyTalkRoom } from './models/VerbfyTalkRoom';
import { verifyToken } from './utils/jwt';
import { Types } from 'mongoose';
import { createLogger } from './utils/logger';
import { setupSocketServer } from './socketServer';
import { corsConfig, corsMonitoring, preflightHandler, corsErrorHandler, getAllowedOrigins } from './config/cors';
import { securityMiddleware, ddosProtection, requestSizeLimiter, securityHeaders } from './middleware/security';
import { securityHeaders as enhancedSecurityHeaders, additionalSecurityHeaders, sanitizeRequest, apiVersioning, requestTimeout, securityMonitoring } from './config/security';
import { cspNonceMiddleware, buildCSPWithNonce } from './middleware/cspNonce';
import { performanceMonitoring, startMonitoring, getHealthMetrics, requestTimeoutMonitoring } from './middleware/monitoring';
import { setupLoggingInterceptor, requestLogger } from './middleware/loggingMiddleware';
import livekitRoutes from './routes/livekitRoutes';
import authRoutes from './routes/auth';
import userRoutes from './routes/userRoutes';
import reservationRoutes from './routes/reservationRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import notificationRoutes from './routes/notificationRoutes';
import lessonMaterialRoutes from './routes/lessonMaterialRoutes';
import lessonRoutes from './routes/lessons';
import adminRoutes from './routes/adminRoutes';
import adminAuthRoutes from './routes/adminAuth';
import adminSystemRoutes from './routes/adminSystemRoutes';
import messagesRoutes from './routes/messages';
import analyticsRoutes from './routes/analytics';
import materialsRoutes from './routes/materials';
import chatRoutes from './routes/chat';
import paymentRoutes from './routes/payments';
import { handleStripeWebhook } from './controllers/paymentController';
import verbfyTalkRoutes from './routes/verbfyTalk';
import freeMaterialsRoutes from './routes/freeMaterials';
import verbfyLessonsRoutes from './routes/verbfyLessons';
import cefrTestsRoutes from './routes/cefrTests';
import personalizedCurriculumRoutes from './routes/personalizedCurriculum';
import aiLearningRoutes from './routes/aiLearning';
import adaptiveLearningRoutes from './routes/adaptiveLearning';
import { adminNotificationService } from './services/adminNotificationService';
import teacherAnalyticsRoutes from './routes/teacherAnalytics';
import aiContentGenerationRoutes from './routes/aiContentGeneration';
import organizationRoutes from './routes/organization';
import rolesRoutes from './routes/roles';
import gameRoutes from './routes/gameRoutes';
import healthRoutes from './routes/healthRoutes';
import performanceRoutes from './routes/performanceRoutes';
import lessonChatRoutes from './routes/lessonChat';
import teacherRoutes from './routes/teacherRoutes';
import { VerbfyTalkController } from './controllers/verbfyTalkController';
import { performanceMiddleware, memoryTrackingMiddleware, requestSizeMiddleware } from './middleware/performanceMiddleware';
import { setSocketIO } from './socket';
import { requestIdMiddleware } from './middleware/requestId';

// Load environment variables and initialize Sentry
dotenv.config();

// Force redeploy to fix admin routes in production - 2025-01-20

// Create context-specific loggers
const serverLogger = createLogger('Server');
const socketLogger = createLogger('Socket');
const roomLogger = createLogger('Room');

// Initialize Sentry with CommonJS require
try {
  require('./instrument.js');
} catch (error: any) {
  serverLogger.warn('Sentry initialization failed:', error?.message || 'Unknown error');
}

// Validate environment variables before starting the application
try {
  validateEnvironment();
} catch (error) {
  serverLogger.error('Environment validation failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}

// Initialize monitoring
initMonitoring();

// Setup logging interceptor to standardize all console logs
setupLoggingInterceptor();

// Initialize express and HTTP server
const app = express();
const server = createServer(app);

// Behind proxy (nginx) trust X-Forwarded-* for secure cookies and IPs
app.set('trust proxy', 1);

// Enhanced security middleware - MUST BE FIRST
app.use(enhancedSecurityHeaders);
app.use(additionalSecurityHeaders);
app.use(sanitizeRequest);
app.use(securityMonitoring);
app.use(ddosProtection);
app.use(requestSizeLimiter(10 * 1024 * 1024)); // 10MB limit

// Request ID tracking - must be early so all logs include it
app.use(requestIdMiddleware);

// Performance monitoring
app.use(performanceMonitoring);
app.use(requestTimeoutMonitoring(30000));
app.use(performanceMiddleware);
app.use(memoryTrackingMiddleware);
app.use(requestSizeMiddleware);

// CORS middleware with monitoring - ENABLED as backup to Nginx CORS
app.use(corsMonitoring);
app.use(preflightHandler);
app.use(cors(corsConfig));

// Security monitoring
app.use(securityMiddleware);

// Add permission headers for WebRTC
app.use((req, res, next) => {
  const allowedOrigins = getAllowedOrigins();
  const webrtcDomains = process.env.NODE_ENV === 'production' 
    ? allowedOrigins.filter(origin => origin.startsWith('https://')).map(domain => `"${domain}"`).join(' ')
    : '"http://localhost:3000"';
  
  res.setHeader('Permissions-Policy', `microphone=(self ${webrtcDomains}), camera=(self ${webrtcDomains}), geolocation=(self ${webrtcDomains})`);
  res.setHeader('Feature-Policy', `microphone self ${webrtcDomains.replace(/"/g, '')}; camera self ${webrtcDomains.replace(/"/g, '')}; geolocation self ${webrtcDomains.replace(/"/g, '')}`);
  next();
});

// CORS setup completed

// Structured request logging middleware
app.use(requestLogger);

// API versioning and timeout
app.use(apiVersioning);
app.use(requestTimeout(30000)); // 30 second timeout

// Stripe webhook needs raw body; define before parsers and CSRF
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Sentry init (non-blocking if DSN missing)
try {
  const Sentry = require('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.0 });
  // Support both v7 (Handlers) and guard types
  const reqHandler = Sentry.Handlers?.requestHandler?.();
  if (reqHandler) app.use(reqHandler);
} catch (error: any) {
  serverLogger.warn('Sentry request handler not available:', error?.message || 'Unknown error');
}

// Security middleware
const isDev = process.env.NODE_ENV !== 'production';
const allowedFrames = (process.env.ALLOWED_FRAME_SRC || '').split(',').map(s => s.trim()).filter(Boolean);

// Apply CSP nonce middleware before helmet
app.use(cspNonceMiddleware);

// Microphone permission headers already set above

const cspDirectives: any = {
  defaultSrc: ["'self'"],
  styleSrc: [
    "'self'",
    // 'unsafe-inline' removed - nonce-based CSP is now used
    "https://fonts.googleapis.com",
    "https://cdnjs.cloudflare.com", // Font Awesome
  ],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
  imgSrc: ["'self'", "data:", "blob:", "https:"],
  scriptSrc: isDev ? ["'self'", "'unsafe-eval'"] : ["'self'"],
  // 'unsafe-inline' removed from scriptSrc - use nonce for inline scripts
  connectSrc: [
    "'self'",
    "https:",
    "wss:",
    process.env.LIVEKIT_CLOUD_URL || '',
    process.env.LIVEKIT_SELF_URL || ''
  ].filter(Boolean),
  // Allow embedding trusted frames for VerbfyGames (iframe-based games)
  frameSrc: isDev ? ["'self'", "https:", "http:", ...allowedFrames] : ["'self'", ...allowedFrames],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  frameAncestors: ["'none'"]
};
app.use(helmet({
  contentSecurityPolicy: { directives: cspDirectives },
  crossOriginEmbedderPolicy: false
}));

// Apply nonce-based CSP for OAuth callback pages
app.use('/api/auth/oauth', (req, res, next) => {
  const nonce = res.locals.cspNonce;
  if (nonce) {
    try { res.removeHeader('Content-Security-Policy'); } catch (_) {}
    const cspString = buildCSPWithNonce(nonce);
    res.setHeader('Content-Security-Policy', cspString);
  }
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
  serverLogger.warn('Could not ensure uploads directory exists:', e);
}
app.use('/uploads', express.static(uploadsRoot));

// Initialize Socket.IO server
const mainIo = new SocketIOServer(server, {
  path: '/socket.io',
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins();
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      serverLogger.warn('Socket.IO CORS blocked origin:', origin);
      serverLogger.info('Allowed origins:', allowedOrigins);
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-CSRF-Token",
      "x-csrf-token",
      "Idempotency-Key",
      "idempotency-key",
      "Cache-Control",
      "User-Agent"
    ]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
  maxHttpBufferSize: 1e6,
  allowUpgrades: true,
  upgradeTimeout: 30000,
  connectTimeout: 45000,
  // Better WebSocket handling for production
  perMessageDeflate: {
    threshold: 1024,
    concurrencyLimit: 10,
    windowBits: 13
  },
  httpCompression: true,
  // Add connection state recovery for better reliability
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
  // Engine.IO options for better compatibility
  allowRequest: (req, callback) => {
    // Additional security checks can be added here
    callback(null, true);
  }
});

// Socket interface with user property
interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// Authentication middleware for all namespaces
const authMiddleware = async (socket: AuthenticatedSocket, next: any) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return next(new Error('Authentication failed: No token provided'));
  }

  try {
    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.id) {
      return next(new Error('Authentication failed: Invalid token'));
    }
    
    // Verify user exists in database
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return next(new Error('Authentication failed: User not found'));
    }

    socket.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    return next(new Error('Authentication failed: Token verification failed'));
  }
};

// Admin authentication middleware with role verification
const adminAuthMiddleware = async (socket: AuthenticatedSocket, next: any) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return next(new Error('Authentication failed: No token provided'));
  }

  try {
    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.id) {
      return next(new Error('Authentication failed: Invalid token'));
    }
    
    // Verify user exists in database
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return next(new Error('Authentication failed: User not found'));
    }

    // Verify admin role
    if (user.role !== 'admin') {
      return next(new Error('Authorization failed: Admin role required'));
    }

    socket.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    return next(new Error('Authentication failed: Token verification failed'));
  }
};

// Create namespaces for different features
const chatNamespace = mainIo.of('/chat');
const notificationNamespace = mainIo.of('/notifications');
const verbfyTalkNamespace = mainIo.of('/verbfy-talk');
const voiceChatNamespace = mainIo.of('/voice-chat');
const adminNamespace = mainIo.of('/admin');

// Initialize admin notification service with the Socket.IO server
adminNotificationService.setSocketServer(mainIo);

// Set global Socket.IO instance for use in controllers
setSocketIO(mainIo);

// Apply authentication to all namespaces
chatNamespace.use(authMiddleware);
notificationNamespace.use(authMiddleware);
verbfyTalkNamespace.use(authMiddleware);
voiceChatNamespace.use(authMiddleware);
adminNamespace.use(adminAuthMiddleware);

// Chat namespace events
chatNamespace.on('connection', (socket: AuthenticatedSocket) => {
  socketLogger.info('Chat namespace connected:', socket.user?.name);
  
  socket.on('join-room', (data: { roomId: string }) => {
    socket.join(data.roomId);
    socketLogger.info(`User ${socket.user?.name} joined chat room: ${data.roomId}`);
  });
  
  socket.on('leave-room', (data: { roomId: string }) => {
    socket.leave(data.roomId);
    socketLogger.info(`User ${socket.user?.name} left chat room: ${data.roomId}`);
  });
  
  socket.on('send-message', (data: { roomId: string; message: any }) => {
    socket.to(data.roomId).emit('receive-message', {
      ...data.message,
      sender: socket.user
    });
  });
  
  socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
    socket.to(data.roomId).emit('user-typing', {
      userId: socket.user?.id,
      isTyping: data.isTyping
    });
  });
});

// Notification namespace events
notificationNamespace.on('connection', (socket: AuthenticatedSocket) => {
  socketLogger.info('Notification namespace connected:', socket.user?.name);
  
  socket.on('joinNotificationRoom', (userId: string) => {
    socket.join(`notification-${userId}`);
    socketLogger.info(`User ${socket.user?.name} joined notification room: ${userId}`);
  });
  
  socket.on('disconnect', () => {
    socketLogger.info('Notification namespace disconnected:', socket.user?.name);
  });
});

// VerbfyTalk namespace events
verbfyTalkNamespace.on('connection', (socket: AuthenticatedSocket) => {
  socketLogger.info('VerbfyTalk namespace connected:', socket.user?.name);
  
  // Store room information for this socket
  let currentRoomId: string | null = null;
  
  // Get rooms list
  socket.on('rooms:get', async () => {
    try {
      const rooms = await VerbfyTalkRoom.find({ isActive: true })
        .populate('createdBy', 'name email avatar')
        .populate('participants.userId', 'name email avatar')
        .sort({ createdAt: -1 });
      
      const roomsWithActiveCount = rooms.map(room => {
        const activeCount = room.participants.filter((p: any) => p.isActive).length;
        return {
          ...room.toObject(),
          activeParticipantCount: activeCount
        };
      });
      
      socket.emit('rooms:list', roomsWithActiveCount);
    } catch (error) {
      roomLogger.error('Error fetching rooms:', error);
    }
  });
  
  // Join room
  socket.on('room:join', async (data: { roomId: string }) => {
    try {
      const room = await VerbfyTalkRoom.findById(data.roomId)
        .populate('createdBy', 'name email avatar')
        .populate('participants.userId', 'name email avatar');
      
      if (!room || !room.isActive) {
        socket.emit('room:error', { message: 'Room not found or inactive' });
        return;
      }
      
      // Check if user is already in the room (active)
      const existingParticipant = room.participants.find((p: any) => 
        p.userId.toString() === socket.user?.id && p.isActive
      );
      
      if (existingParticipant) {
        socket.emit('room:error', { message: 'Already in room' });
        return;
      }
      
             // Check if user was previously in room but inactive (rejoin)
       const inactiveParticipantIndex = room.participants.findIndex((p: any) => 
         p.userId.toString() === socket.user?.id && !p.isActive
       );
       
       if (inactiveParticipantIndex !== -1) {
         // Reactivate existing participant
         room.participants[inactiveParticipantIndex].isActive = true;
         room.participants[inactiveParticipantIndex].joinedAt = new Date();
         room.participants[inactiveParticipantIndex].leftAt = undefined;
               } else {
          // Add new participant
          room.participants.push({
            userId: new Types.ObjectId(socket.user?.id!),
            joinedAt: new Date(),
            isActive: true
          });
        }
      
      await room.save();
      
      // Join socket room
      socket.join(data.roomId);
      currentRoomId = data.roomId;
      
             // Get updated room with populated data
       const updatedRoom = await VerbfyTalkRoom.findById(data.roomId)
         .populate('createdBy', 'name email avatar')
         .populate('participants.userId', 'name email avatar');
       
       // Send room joined confirmation
       if (updatedRoom) {
         socket.emit('room:joined', updatedRoom);
       }
      
      // Notify other participants
      socket.to(data.roomId).emit('participant:joined', {
        id: socket.user?.id,
        name: socket.user?.name,
        isSpeaking: false,
        isMuted: false,
        isSpeaker: false
      });
      
             // Send current participants list to the new user
       if (updatedRoom) {
         const activeParticipants = updatedRoom.participants
           .filter((p: any) => p.isActive)
           .map((p: any) => ({
             id: p.userId._id.toString(),
             name: p.userId.name,
             isSpeaking: false,
             isMuted: false,
             isSpeaker: false
           }));
         
         socket.emit('participants:update', activeParticipants);
       }
      
      roomLogger.info(`User ${socket.user?.name} joined VerbfyTalk room: ${data.roomId}`);
    } catch (error) {
      roomLogger.error('Error joining room:', error);
      socket.emit('room:error', { message: 'Failed to join room' });
    }
  });
  
  // Leave room
  socket.on('room:leave', async (data: { roomId: string }) => {
    try {
      const room = await VerbfyTalkRoom.findById(data.roomId);
      if (!room) {
        return;
      }
      
      // Find and deactivate user's participation
      const participantIndex = room.participants.findIndex((p: any) => 
        p.userId.toString() === socket.user?.id && p.isActive
      );
      
      if (participantIndex !== -1) {
        room.participants[participantIndex].isActive = false;
        room.participants[participantIndex].leftAt = new Date();
        
        // If no active participants, end the room
        const activeParticipants = room.participants.filter((p: any) => p.isActive).length;
        if (activeParticipants === 0) {
          room.endedAt = new Date();
          room.isActive = false;
          roomLogger.info(`Room ${room.name} (${data.roomId}) ended - no active participants`);
        }
        
        await room.save();
      }
      
      // Leave socket room
      socket.leave(data.roomId);
      currentRoomId = null;
      
      // Notify other participants
      socket.to(data.roomId).emit('participant:left', socket.user?.id);
      
      // Send confirmation to user
      socket.emit('room:left');
      
      roomLogger.info(`User ${socket.user?.name} left VerbfyTalk room: ${data.roomId}`);
    } catch (error) {
      roomLogger.error('Error leaving room:', error);
    }
  });
  
  // Create room
  socket.on('room:create', async (data: { name: string }, callback) => {
    try {
             const roomData = {
         name: data.name,
         createdBy: new Types.ObjectId(socket.user?.id!),
         participants: [{ userId: new Types.ObjectId(socket.user?.id!), joinedAt: new Date(), isActive: true }]
       };
      
      const room = new VerbfyTalkRoom(roomData);
      await room.save();
      
      const populatedRoom = await VerbfyTalkRoom.findById(room._id)
        .populate('createdBy', 'name email avatar')
        .populate('participants.userId', 'name email avatar');
      
      callback({ success: true, roomId: room._id.toString() });
      
      // Join the created room
      socket.emit('room:joined', populatedRoom);
      socket.join(room._id.toString());
      currentRoomId = room._id.toString();
      
      roomLogger.info(`User ${socket.user?.name} created and joined room: ${data.name}`);
    } catch (error) {
      roomLogger.error('Error creating room:', error);
      callback({ success: false });
    }
  });
  
  // Participant events
  socket.on('participant:mute', (data: { roomId: string; isMuted: boolean }) => {
    socket.to(data.roomId).emit('participant:mute', {
      participantId: socket.user?.id,
      isMuted: data.isMuted
    });
  });
  
  socket.on('participant:speaking', (data: { roomId: string; isSpeaking: boolean }) => {
    socket.to(data.roomId).emit('participant:speaking', {
      participantId: socket.user?.id,
      isSpeaking: data.isSpeaking
    });
  });
  
  socket.on('participant:speaker', (data: { roomId: string; isSpeaker: boolean }) => {
    socket.to(data.roomId).emit('participant:speaker', {
      participantId: socket.user?.id,
      isSpeaker: data.isSpeaker
    });
  });
  
     // WebRTC signaling
   socket.on('webrtc:offer', (data: { roomId: string; to: string; offer: any }) => {
     socket.to(data.roomId).emit('webrtc:offer', {
       from: socket.user?.id,
       offer: data.offer
     });
   });
   
   socket.on('webrtc:answer', (data: { roomId: string; to: string; answer: any }) => {
     socket.to(data.roomId).emit('webrtc:answer', {
       from: socket.user?.id,
       answer: data.answer
     });
   });
   
   socket.on('webrtc:ice-candidate', (data: { roomId: string; to: string; candidate: any }) => {
     socket.to(data.roomId).emit('webrtc:ice-candidate', {
       from: socket.user?.id,
       candidate: data.candidate
     });
   });
  
  // Room messages
  socket.on('send-room-message', (data: { roomId: string; content: string; timestamp: number }) => {
    socket.to(data.roomId).emit('room-message', {
      id: Date.now().toString(),
      content: data.content,
      sender: socket.user?.id,
      senderName: socket.user?.name,
      timestamp: data.timestamp
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', async () => {
    socketLogger.info('VerbfyTalk namespace disconnected:', socket.user?.name);
    
    // Clean up user from room if they were in one
    if (currentRoomId) {
      try {
        const room = await VerbfyTalkRoom.findById(currentRoomId);
        if (room) {
          const participantIndex = room.participants.findIndex((p: any) => 
            p.userId.toString() === socket.user?.id && p.isActive
          );
          
          if (participantIndex !== -1) {
            room.participants[participantIndex].isActive = false;
            room.participants[participantIndex].leftAt = new Date();
            
            // If no active participants, end the room
            const activeParticipants = room.participants.filter((p: any) => p.isActive).length;
            if (activeParticipants === 0) {
              room.endedAt = new Date();
              room.isActive = false;
              roomLogger.info(`Room ${room.name} (${currentRoomId}) ended - no active participants`);
            }
            
            await room.save();
            
            // Notify other participants
            socket.to(currentRoomId).emit('participant:left', socket.user?.id);
          }
        }
      } catch (error) {
        roomLogger.error('Error cleaning up user on disconnect:', error);
      }
    }
  });
});

// Voice Chat namespace events
voiceChatNamespace.on('connection', (socket: AuthenticatedSocket) => {
  socketLogger.info('Voice Chat namespace connected:', socket.user?.name);
  
  socket.on('join-room', (data: { roomId: string }) => {
    socket.join(data.roomId);
    socketLogger.info(`User ${socket.user?.name} joined voice chat room: ${data.roomId}`);
  });
  
  socket.on('leave-room', (data: { roomId: string }) => {
    socket.leave(data.roomId);
    socketLogger.info(`User ${socket.user?.name} left voice chat room: ${data.roomId}`);
  });
  
  // Voice chat specific events
  socket.on('voice-offer', (data: { roomId: string; offer: any }) => {
    socket.to(data.roomId).emit('voice-offer', {
      userId: socket.user?.id,
      userName: socket.user?.name,
      offer: data.offer
    });
  });
  
  socket.on('voice-answer', (data: { roomId: string; answer: any }) => {
    socket.to(data.roomId).emit('voice-answer', {
      userId: socket.user?.id,
      userName: socket.user?.name,
      answer: data.answer
    });
  });
});

// Admin namespace events
adminNamespace.on('connection', (socket: AuthenticatedSocket) => {
  socketLogger.info('Admin namespace connected:', socket.user?.name);
  
  // Join admin room for broadcast notifications
  socket.join('admin-room');
  
  // Notify other admins of new admin connection
  socket.to('admin-room').emit('admin:connected', {
    adminId: socket.user?.id,
    adminName: socket.user?.name,
    timestamp: new Date().toISOString()
  });
  
  // System monitoring events
  socket.on('admin:subscribe-system-health', () => {
    socket.join('system-health');
    socketLogger.info(`Admin ${socket.user?.name} subscribed to system health updates`);
  });
  
  socket.on('admin:unsubscribe-system-health', () => {
    socket.leave('system-health');
    socketLogger.info(`Admin ${socket.user?.name} unsubscribed from system health updates`);
  });
  
  // Security monitoring events
  socket.on('admin:subscribe-security-alerts', () => {
    socket.join('security-alerts');
    socketLogger.info(`Admin ${socket.user?.name} subscribed to security alerts`);
  });
  
  socket.on('admin:unsubscribe-security-alerts', () => {
    socket.leave('security-alerts');
    socketLogger.info(`Admin ${socket.user?.name} unsubscribed from security alerts`);
  });
  
  // User management events
  socket.on('admin:subscribe-user-activities', () => {
    socket.join('user-activities');
    socketLogger.info(`Admin ${socket.user?.name} subscribed to user activities`);
  });
  
  socket.on('admin:unsubscribe-user-activities', () => {
    socket.leave('user-activities');
    socketLogger.info(`Admin ${socket.user?.name} unsubscribed from user activities`);
  });
  
  // Admin chat/communication
  socket.on('admin:send-message', (data: { message: string; type: 'info' | 'warning' | 'urgent' }) => {
    socket.to('admin-room').emit('admin:message', {
      adminId: socket.user?.id,
      adminName: socket.user?.name,
      message: data.message,
      type: data.type,
      timestamp: new Date().toISOString()
    });
    socketLogger.info(`Admin ${socket.user?.name} sent message: ${data.message}`);
  });
  
  // Cache management events
  socket.on('admin:cache-cleared', (data: { pattern?: string; success: boolean }) => {
    socket.to('admin-room').emit('admin:cache-update', {
      action: 'cleared',
      pattern: data.pattern,
      success: data.success,
      adminId: socket.user?.id,
      adminName: socket.user?.name,
      timestamp: new Date().toISOString()
    });
  });
  
  // User action notifications
  socket.on('admin:user-action', (data: { 
    action: 'banned' | 'unbanned' | 'role-changed' | 'deleted';
    targetUserId: string;
    targetUserName: string;
    details?: any;
  }) => {
    socket.to('admin-room').emit('admin:user-action-notification', {
      action: data.action,
      targetUserId: data.targetUserId,
      targetUserName: data.targetUserName,
      details: data.details,
      adminId: socket.user?.id,
      adminName: socket.user?.name,
      timestamp: new Date().toISOString()
    });
  });
  
  // Payment management notifications
  socket.on('admin:payment-action', (data: {
    action: 'approved' | 'rejected' | 'refunded';
    paymentId: string;
    amount: number;
    userId: string;
    details?: any;
  }) => {
    socket.to('admin-room').emit('admin:payment-notification', {
      action: data.action,
      paymentId: data.paymentId,
      amount: data.amount,
      userId: data.userId,
      details: data.details,
      adminId: socket.user?.id,
      adminName: socket.user?.name,
      timestamp: new Date().toISOString()
    });
  });
  
  // Teacher approval notifications
  socket.on('admin:teacher-action', (data: {
    action: 'approved' | 'rejected';
    teacherId: string;
    teacherName: string;
    details?: any;
  }) => {
    socket.to('admin-room').emit('admin:teacher-notification', {
      action: data.action,
      teacherId: data.teacherId,
      teacherName: data.teacherName,
      details: data.details,
      adminId: socket.user?.id,
      adminName: socket.user?.name,
      timestamp: new Date().toISOString()
    });
  });
  
  // Disconnect handling
  socket.on('disconnect', (reason) => {
    socketLogger.info(`Admin ${socket.user?.name} disconnected from admin namespace: ${reason}`);
    
    // Notify other admins of disconnection
    socket.to('admin-room').emit('admin:disconnected', {
      adminId: socket.user?.id,
      adminName: socket.user?.name,
      reason,
      timestamp: new Date().toISOString()
    });
  });
});

socketLogger.info('Socket.IO Setup - Main server initialized with namespaces including admin namespace');

// Permissions policy headers already set above

// Enhanced Socket.IO middleware with better error handling
mainIo.use((socket, next) => {
  try {
    let token = (socket.handshake.auth && (socket.handshake.auth as any).token) as string | undefined;
    
    // Fallback to accessToken cookie if no auth token provided
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

    if (!token) {
      socketLogger.warn('Socket connection attempt without token');
      return next(new Error('Unauthorized - No token provided'));
    }

    try {
    const payload = verifyToken(token);
    (socket as any).user = payload;
      socketLogger.info('Socket authenticated for user:', payload.id);
    next();
    } catch (jwtError: any) {
      socketLogger.warn('Socket JWT verification failed:', jwtError.message);
      return next(new Error('Unauthorized - Invalid token'));
    }
  } catch (e) {
    socketLogger.error('Socket middleware error:', e);
    return next(new Error('Unauthorized - Middleware error'));
  }
});

// Attach io to request for controllers that need to emit events
app.use((req, _res, next) => {
  (req as any).io = mainIo;
  next();
});

// Connect to MongoDB
process.env.NODE_ENV !== 'test' && connectDB();

// Initialize cache service
cacheService.connect();

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

// CSRF: issue token cookie and header, and verify on state-changing requests in production
app.use(setCsrfCookie);
app.use(verifyCsrf);

// CSRF fetch endpoint: returns 200 and relies on middleware to issue cookie+header
app.get('/api/auth/csrf', (_req, res) => {
  try {
    const token = (res as any).get ? (res as any).get('X-CSRF-Token') : undefined;
    return res.status(200).json({ success: true, csrfToken: token || undefined });
  } catch {
    return res.status(200).json({ success: true });
  }
});

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    serverLogger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// Enhanced health check endpoint with monitoring
app.get('/api/health', (_req, res) => {
  const allowedOrigins = getAllowedOrigins();
  const healthMetrics = getHealthMetrics();
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: {
      allowedOrigins,
      nodeEnv: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL,
      corsExtraOrigins: process.env.CORS_EXTRA_ORIGINS
    },
    monitoring: healthMetrics
  });
});

// CORS test endpoint removed - no longer needed

// Health check routes (before authentication)
app.use('/health', healthRoutes);
app.use('/api/performance', performanceRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/livekit', livekitRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/lesson-materials', lessonMaterialRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/system', adminSystemRoutes);
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
app.use('/api/adaptive-learning', adaptiveLearningRoutes);
app.use('/api/teacher-analytics', teacherAnalyticsRoutes);
app.use('/api/ai-content-generation', aiContentGenerationRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/lesson-chat', lessonChatRoutes);
app.use('/api/teacher', teacherRoutes);

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

// Setup WebRTC Socket.IO namespace
const webrtcNamespace = mainIo.of('/webrtc');
setupSocketServer(server, webrtcNamespace);

// Socket.IO event handling for main namespace (chat, notifications)
mainIo.on('connection', (socket) => {
  socketLogger.info(`User connected: ${socket.id}`);
  
  // Get user from socket
  const user = (socket as any).user;
  if (user?.id) {
    socket.join(`user_${user.id}`);
    socketLogger.info(`User ${user.id} joined notification room`);
  }

  // Handle notification room joining
  socket.on('joinNotificationRoom', (userId: string) => {
    socket.join(`user_${userId}`);
    socketLogger.info(`User ${userId} joined notification room`);
  });

  // Join a conversation room
  socket.on('joinRoom', (conversationId: string) => {
    socket.join(conversationId);
    socketLogger.info(`User ${socket.id} joined room: ${conversationId}`);
  });

  // Leave a conversation room
  socket.on('leaveRoom', (conversationId: string) => {
    socket.leave(conversationId);
    socketLogger.info(`User ${socket.id} left room: ${conversationId}`);
  });

  // Handle new message
  socket.on('sendMessage', (data: { conversationId: string; message: any }) => {
    // Broadcast the message to all users in the conversation room
    socket.to(data.conversationId).emit('receiveMessage', data.message);
    socketLogger.info(`Message sent in room ${data.conversationId}: ${data.message.content}`);
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
    socketLogger.info(`User disconnected: ${socket.id}`);
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
  serverLogger.warn('Sentry error handler not available:', error?.message || 'Unknown error');
}

// Global error handler (must be last)
app.use(corsErrorHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    serverLogger.info(`🚀 Server running on port ${PORT}`);
    serverLogger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    serverLogger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    serverLogger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
    serverLogger.info(`🗄️ Database: ${process.env.MONGO_URI ? 'Connected' : 'Not configured'}`);
    serverLogger.info(`🔌 Socket.IO: Enabled for real-time communication`);
    serverLogger.info(`📈 Monitoring: Started`);
    
    // Start monitoring system
    startMonitoring();
    
    serverLogger.info(`📋 Available API Routes:`);
    serverLogger.info(`   - /api/auth (Authentication)`);
    serverLogger.info(`   - /api/users (User management)`);
    serverLogger.info(`   - /api/livekit (Video conferencing)`);
    serverLogger.info(`   - /api/reservations (Lesson booking)`);
    serverLogger.info(`   - /api/availability (Teacher availability)`);
    serverLogger.info(`   - /api/notifications (Notifications)`);
    serverLogger.info(`   - /api/materials (Learning materials - NEW)`);
    serverLogger.info(`   - /api/lesson-materials (Lesson materials - Legacy)`);
    serverLogger.info(`   - /api/admin (Admin functions)`);
    serverLogger.info(`   - /api/messages (Messaging system)`);
    serverLogger.info(`   - /api/analytics (Analytics & reports)`);
    serverLogger.info(`   - /api/chat (Real-time chat system)`);
    serverLogger.info(`   - /api/verbfy-talk (Voice chat rooms)`);
  });
}


// Setup cron job for cleaning up empty rooms (every 5 minutes)
if ((process.env.NODE_ENV || 'development') !== 'test') {
  setInterval(async () => {
    try {
      await VerbfyTalkController.cleanupEmptyRooms();
    } catch (error) {
      serverLogger.error('Cron job failed:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  serverLogger.info(`Room cleanup cron job started (every 5 minutes)`);
}

// Export app for testing
export { app };