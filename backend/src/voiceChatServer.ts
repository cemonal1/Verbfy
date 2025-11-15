import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { createLogger } from './utils/logger';

const voiceChatLogger = createLogger('VoiceChat');

interface User {
  id: string;
  name: string;
  roomId: string;
  socketId: string;
}

interface Room {
  id: string;
  users: Map<string, User>;
  maxUsers: number;
  createdAt: Date;
}

interface SignalingData {
  type: 'offer' | 'answer' | 'ice-candidate';
  offer?: any;
  answer?: any;
  candidate?: any;
  to: string;
}

export class VoiceChatServer {
  private io: SocketIOServer;
  private rooms: Map<string, Room> = new Map();
  private userRooms: Map<string, string> = new Map(); // socketId -> roomId
  private users: Map<string, User> = new Map(); // socketId -> User

  constructor(server: HTTPServer) {
    // Get centralized CORS origins
    const defaultOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
    const extraOrigins = (process.env.CORS_EXTRA_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const productionDomains = process.env.PRODUCTION_DOMAINS 
      ? process.env.PRODUCTION_DOMAINS.split(',').map(s => s.trim()).filter(Boolean)
      : ['https://verbfy.com', 'https://www.verbfy.com', 'https://api.verbfy.com'];
    
    const allowedOrigins = [
      defaultOrigin, 
      ...extraOrigins,
      ...(process.env.NODE_ENV === 'production' ? productionDomains : [])
    ];

    this.io = new SocketIOServer(server, {
      path: '/voice-chat',
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin (mobile apps, etc.)
          if (!origin) return callback(null, true);
          
          // Check if origin is in allowed list
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }

          voiceChatLogger.warn('CORS blocked origin', { origin, allowedOrigins });
          return callback(new Error('Not allowed by CORS'), false);
        },
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true,
        allowedHeaders: [
          'Content-Type', 
          'Authorization', 
          'X-Requested-With',
          'Upgrade',
          'Connection',
          'Sec-WebSocket-Key',
          'Sec-WebSocket-Version',
          'Sec-WebSocket-Protocol'
        ]
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      allowEIO3: true,
      maxHttpBufferSize: 1e6,
      allowRequest: (req, callback) => {
        voiceChatLogger.debug('Connection request', {
          origin: req.headers.origin,
          upgrade: req.headers.upgrade,
          connection: req.headers.connection,
          userAgent: req.headers['user-agent']
        });
        callback(null, true);
      }
    });

    this.setupEventHandlers();
    this.startRoomCleanup();
    voiceChatLogger.info('Voice Chat P2P Server initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      voiceChatLogger.info('User connected', { socketId: socket.id });

      // Authenticate user
      socket.on('authenticate', (data: { token: string }) => {
        try {
          const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'fallback-secret') as any;
          const user: User = {
            id: decoded.userId || decoded.id,
            name: decoded.name || 'Anonymous',
            roomId: '',
            socketId: socket.id
          };
          
          this.users.set(socket.id, user);
          socket.emit('authenticated', { success: true, user: { id: user.id, name: user.name } });
          voiceChatLogger.info('User authenticated', { userName: user.name, userId: user.id, socketId: socket.id });
        } catch (error) {
          voiceChatLogger.error('Authentication failed', error);
          socket.emit('authentication_error', { message: 'Invalid token' });
          socket.disconnect();
        }
      });

      // Join room
      socket.on('joinRoom', (data: { roomId: string }) => {
        const user = this.users.get(socket.id);
        if (!user) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        const { roomId } = data;
        voiceChatLogger.info('User attempting to join room', { userName: user.name, userId: user.id, roomId });

        // Check if room exists and has space
        let room = this.rooms.get(roomId);
        if (!room) {
          room = {
            id: roomId,
            users: new Map(),
            maxUsers: 5,
            createdAt: new Date()
          };
          this.rooms.set(roomId, room);
          voiceChatLogger.info('Created new room', { roomId });
        }

        if (room.users.size >= room.maxUsers) {
          socket.emit('roomFull', { message: 'Room is full (max 5 users)' });
          voiceChatLogger.warn('Room is full', { roomId, currentUsers: room.users.size, maxUsers: room.maxUsers });
          return;
        }

        // Remove user from previous room if any
        if (user.roomId) {
          this.leaveRoom(socket.id);
        }

        // Add user to room
        user.roomId = roomId;
        room.users.set(socket.id, user);
        this.userRooms.set(socket.id, roomId);
        socket.join(roomId);

        // Notify other users in the room
        socket.to(roomId).emit('userJoined', {
          userId: user.id,
          userName: user.name,
          socketId: socket.id
        });

        // Send current room users to the joining user
        const roomUsers = Array.from(room.users.values()).map(u => ({
          id: u.id,
          name: u.name,
          socketId: u.socketId
        }));

        socket.emit('roomJoined', {
          roomId,
          users: roomUsers,
          message: `Joined room ${roomId}`
        });

        voiceChatLogger.info('User joined room', { userName: user.name, userId: user.id, roomId, userCount: room.users.size, maxUsers: room.maxUsers });
      });

      // Leave room
      socket.on('leaveRoom', () => {
        this.leaveRoom(socket.id);
      });

      // WebRTC signaling
      socket.on('signal', (data: SignalingData) => {
        const user = this.users.get(socket.id);
        if (!user || !user.roomId) {
          voiceChatLogger.warn('Signal from unauthenticated user or user not in room', { socketId: socket.id });
          return;
        }

        const { to, type } = data;
        voiceChatLogger.debug('WebRTC signal', { from: user.name, to, type });

        // Relay signal to target user
        socket.to(to).emit('signal', {
          from: socket.id,
          data
        });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        voiceChatLogger.info('User disconnected', { socketId: socket.id, reason });
        this.leaveRoom(socket.id);
        this.users.delete(socket.id);
      });

      // Handle connection errors
      socket.on('error', (error) => {
        voiceChatLogger.error('Socket error', error);
      });
    });
  }

  private leaveRoom(socketId: string): void {
    const user = this.users.get(socketId);
    if (!user || !user.roomId) return;

    const room = this.rooms.get(user.roomId);
    if (!room) return;

    // Remove user from room
    room.users.delete(socketId);
    this.userRooms.delete(socketId);
    user.roomId = '';

    // Notify other users
    this.io.to(user.roomId).emit('userLeft', {
      userId: user.id,
      userName: user.name,
      socketId: socketId
    });

    voiceChatLogger.info('User left room', { userName: user.name, userId: user.id, roomId: user.roomId, userCount: room.users.size, maxUsers: room.maxUsers });

    // Clean up empty rooms
    if (room.users.size === 0) {
      this.rooms.delete(user.roomId);
      voiceChatLogger.info('Deleted empty room', { roomId: user.roomId });
    }
  }

  private startRoomCleanup(): void {
    // Clean up empty rooms every 5 minutes
    setInterval(() => {
      let cleanedCount = 0;
      for (const [roomId, room] of this.rooms.entries()) {
        if (room.users.size === 0) {
          this.rooms.delete(roomId);
          cleanedCount++;
        }
      }
      if (cleanedCount > 0) {
        voiceChatLogger.info('Periodic room cleanup completed', { cleanedRooms: cleanedCount });
      }
    }, 5 * 60 * 1000);
  }

  public getStats() {
    return {
      totalRooms: this.rooms.size,
      totalUsers: this.users.size,
      rooms: Array.from(this.rooms.entries()).map(([id, room]) => ({
        id,
        userCount: room.users.size,
        maxUsers: room.maxUsers,
        createdAt: room.createdAt
      }))
    };
  }
}

export function createVoiceChatServer(server: HTTPServer): VoiceChatServer {
  return new VoiceChatServer(server);
}
