import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

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
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  to: string;
}

export class VoiceChatServer {
  private io: SocketIOServer;
  private rooms: Map<string, Room> = new Map();
  private userRooms: Map<string, string> = new Map(); // socketId -> roomId
  private users: Map<string, User> = new Map(); // socketId -> User

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      path: '/socket.io',
      cors: {
        origin: [
          process.env.FRONTEND_URL || "http://localhost:3000",
          "https://www.verbfy.com",
          "https://verbfy.com",
          "http://localhost:3000"
        ],
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
        // Enhanced connection logging
        console.log('🔌 Voice Chat connection request:', {
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
    console.log('🎤 Voice Chat P2P Server initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

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
          console.log(`✅ User authenticated: ${user.name} (${user.id})`);
        } catch (error) {
          console.error('❌ Authentication failed:', error);
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
        console.log(`👤 ${user.name} attempting to join room: ${roomId}`);

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
          console.log(`🏠 Created new room: ${roomId}`);
        }

        if (room.users.size >= room.maxUsers) {
          socket.emit('roomFull', { message: 'Room is full (max 5 users)' });
          console.log(`❌ Room ${roomId} is full`);
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

        console.log(`✅ ${user.name} joined room ${roomId} (${room.users.size}/${room.maxUsers} users)`);
      });

      // Leave room
      socket.on('leaveRoom', () => {
        this.leaveRoom(socket.id);
      });

      // WebRTC signaling
      socket.on('signal', (data: SignalingData) => {
        const user = this.users.get(socket.id);
        if (!user || !user.roomId) {
          console.log('❌ Signal from unauthenticated user or user not in room');
          return;
        }

        const { to, type } = data;
        console.log(`📡 Signal from ${user.name} to ${to}: ${type}`);

        // Relay signal to target user
        socket.to(to).emit('signal', {
          from: socket.id,
          data
        });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`🔌 User disconnected: ${socket.id}, reason: ${reason}`);
        this.leaveRoom(socket.id);
        this.users.delete(socket.id);
      });

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
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

    console.log(`👋 ${user.name} left room ${user.roomId} (${room.users.size}/${room.maxUsers} users)`);

    // Clean up empty rooms
    if (room.users.size === 0) {
      this.rooms.delete(user.roomId);
      console.log(`🗑️ Deleted empty room: ${user.roomId}`);
    }
  }

  private startRoomCleanup(): void {
    // Clean up empty rooms every 5 minutes
    setInterval(() => {
      const now = new Date();
      for (const [roomId, room] of this.rooms.entries()) {
        if (room.users.size === 0) {
          this.rooms.delete(roomId);
          console.log(`🗑️ Cleaned up empty room: ${roomId}`);
        }
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
