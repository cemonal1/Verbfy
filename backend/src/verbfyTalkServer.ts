import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface VerbfyTalkUser {
  id: string;
  name: string;
  roomId: string;
}

interface VerbfyTalkRoom {
  id: string;
  users: Set<string>;
  maxUsers: number;
}

export class VerbfyTalkServer {
  private io: SocketIOServer;
  private rooms: Map<string, VerbfyTalkRoom> = new Map();
  private userRooms: Map<string, string> = new Map(); // userId -> roomId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      path: '/verbfy-talk',
      cors: {
        origin: (origin, callback) => {
          const allowedOrigins = [
            process.env.FRONTEND_URL || "http://localhost:3000",
            "https://www.verbfy.com",
            "https://verbfy.com"
          ];
          
          // Allow requests with no origin (mobile apps, etc.)
          if (!origin) return callback(null, true);
          
          // Check if origin is in allowed list
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          
          console.log('❌ VerbfyTalk CORS blocked origin:', origin);
          console.log('✅ Allowed origins:', allowedOrigins);
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
        console.log('🔌 VerbfyTalk connection request:', {
          origin: req.headers.origin,
          upgrade: req.headers.upgrade,
          connection: req.headers.connection,
          userAgent: req.headers['user-agent']
        });
        callback(null, true);
      }
    });

    // Add authentication middleware
    this.io.use((socket, next) => {
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
          console.log('🔌 VerbfyTalk connection attempt without token');
          return next(new Error('Unauthorized - No token provided'));
        }

        const { verifyToken } = require('../utils/jwt');
        try {
          const payload = verifyToken(token);
          (socket as any).user = payload;
          console.log('🔌 VerbfyTalk authenticated for user:', payload.id);
          next();
        } catch (jwtError: any) {
          console.log('🔌 VerbfyTalk JWT verification failed:', jwtError.message);
          return next(new Error('Unauthorized - Invalid token'));
        }
      } catch (e) {
        console.error('🔌 VerbfyTalk middleware error:', e);
        return next(new Error('Unauthorized - Middleware error'));
      }
    });

    this.setupEventHandlers();
    console.log('🎤 VerbfyTalk P2P Audio Server initialized');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 User connected to VerbfyTalk:', socket.id);

      // Join VerbfyTalk room
      socket.on('joinVerbfyTalkRoom', (data: { roomId: string }) => {
        this.handleJoinRoom(socket, data.roomId);
      });

      // Handle WebRTC signaling
      socket.on('signal', (data: { to: string; signal: any; userName: string }) => {
        this.handleSignal(socket, data);
      });

      // Leave room
      socket.on('leaveVerbfyTalkRoom', (data: { roomId: string }) => {
        this.handleLeaveRoom(socket, data.roomId);
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinRoom(socket: any, roomId: string) {
    try {
      console.log(`🎤 User ${socket.id} trying to join room: ${roomId}`);

      // Get or create room
      let room = this.rooms.get(roomId);
      if (!room) {
        room = {
          id: roomId,
          users: new Set(),
          maxUsers: 5
        };
        this.rooms.set(roomId, room);
        console.log(`🏠 Created new VerbfyTalk room: ${roomId}`);
      }

      // Check if room is full
      if (room.users.size >= room.maxUsers) {
        console.log(`❌ Room ${roomId} is full (${room.users.size}/${room.maxUsers})`);
        socket.emit('roomFull', { 
          message: 'Room is full (maximum 5 users)',
          roomId 
        });
        return;
      }

      // Join the room
      socket.join(roomId);
      room.users.add(socket.id);
      this.userRooms.set(socket.id, roomId);

      // Get user info from authentication
      const user = (socket as any).user;
      const userInfo = {
        userId: user?.id || socket.id,
        userName: user?.name || 'User-' + socket.id.slice(-4),
        roomId
      };

      // Notify other users in the room
      socket.to(roomId).emit('userJoined', userInfo);

      // Send room info to the joining user
      const roomUsers = Array.from(room.users).map(userId => ({
        userId,
        userName: 'User-' + userId.slice(-4)
      }));

      socket.emit('roomJoined', {
        roomId,
        users: roomUsers,
        message: `Successfully joined room ${roomId}`
      });

      console.log(`✅ User ${socket.id} joined room ${roomId}. Total users: ${room.users.size}`);

    } catch (error) {
      console.error('❌ Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  private handleSignal(socket: any, data: { to: string; signal: any; userName: string }) {
    try {
      const { to, signal, userName } = data;
      console.log(`📡 Signal from ${socket.id} to ${to}`);

      // Forward the signal to the target user
      this.io.to(to).emit('signal', {
        from: socket.id,
        signal,
        userName
      });

    } catch (error) {
      console.error('❌ Error handling signal:', error);
    }
  }

  private handleLeaveRoom(socket: any, roomId: string) {
    try {
      console.log(`👋 User ${socket.id} leaving room: ${roomId}`);
      
      const room = this.rooms.get(roomId);
      if (room) {
        room.users.delete(socket.id);
        
        // Notify other users
        socket.to(roomId).emit('userLeft', socket.id);
        
        // Remove room if empty
        if (room.users.size === 0) {
          this.rooms.delete(roomId);
          console.log(`🏠 Removed empty room: ${roomId}`);
        } else {
          console.log(`👥 Room ${roomId} now has ${room.users.size} users`);
        }
      }

      this.userRooms.delete(socket.id);
      socket.leave(roomId);

    } catch (error) {
      console.error('❌ Error leaving room:', error);
    }
  }

  private handleDisconnect(socket: any) {
    try {
      console.log(`❌ User disconnected from VerbfyTalk: ${socket.id}`);
      
      // Find and remove user from their room
      const roomId = this.userRooms.get(socket.id);
      if (roomId) {
        this.handleLeaveRoom(socket, roomId);
      }

    } catch (error) {
      console.error('❌ Error handling disconnect:', error);
    }
  }

  // Get room statistics
  public getRoomStats() {
    const stats = {
      totalRooms: this.rooms.size,
      totalUsers: this.userRooms.size,
      rooms: Array.from(this.rooms.entries()).map(([id, room]) => ({
        id,
        userCount: room.users.size,
        maxUsers: room.maxUsers
      }))
    };
    
    console.log('📊 VerbfyTalk Room Stats:', stats);
    return stats;
  }

  // Clean up empty rooms (optional maintenance)
  public cleanupEmptyRooms() {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.size === 0) {
        this.rooms.delete(roomId);
        console.log(`🧹 Cleaned up empty room: ${roomId}`);
      }
    }
  }
}

// Export factory function
export const createVerbfyTalkServer = (server: HTTPServer) => {
  return new VerbfyTalkServer(server);
};
