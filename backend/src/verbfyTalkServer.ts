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
      path: '/verbfy-talk/socket.io',
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

      // Get rooms list
      socket.on('rooms:get', () => {
        this.handleGetRooms(socket);
      });

      // Join room
      socket.on('room:join', (data: { roomId: string }) => {
        this.handleJoinRoom(socket, data.roomId);
      });

      // Create room
      socket.on('room:create', (data: { name: string }, callback) => {
        this.handleCreateRoom(socket, data.name, callback);
      });

      // Leave room
      socket.on('room:leave', (data: { roomId: string }) => {
        this.handleLeaveRoom(socket, data.roomId);
      });

      // Handle WebRTC signaling
      socket.on('webrtc:offer', (data: { to: string; offer: any; roomId: string }) => {
        this.handleWebRTCOffer(socket, data);
      });

      socket.on('webrtc:answer', (data: { to: string; answer: any; roomId: string }) => {
        this.handleWebRTCAnswer(socket, data);
      });

      socket.on('webrtc:ice-candidate', (data: { to: string; candidate: any; roomId: string }) => {
        this.handleICECandidate(socket, data);
      });

      // Participant events
      socket.on('participant:mute', (data: { roomId: string; isMuted: boolean }) => {
        this.handleParticipantMute(socket, data);
      });

      socket.on('participant:speaking', (data: { roomId: string; isSpeaking: boolean }) => {
        this.handleParticipantSpeaking(socket, data);
      });

      // Chat messages
      socket.on('send-room-message', (data: { roomId: string; content: string; timestamp: number }) => {
        this.handleRoomMessage(socket, data);
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
        id: userId,
        name: 'User-' + userId.slice(-4),
        isSpeaking: false,
        isMuted: false,
        isSpeaker: true
      }));

      socket.emit('room:joined', {
        _id: roomId,
        name: `Room ${roomId}`,
        maxParticipants: room.maxUsers,
        participants: roomUsers,
        isActive: true
      });

      // Update participants list for all users in the room
      socket.to(roomId).emit('participants:update', roomUsers);
      socket.emit('participants:update', roomUsers);

      console.log(`✅ User ${socket.id} joined room ${roomId}. Total users: ${room.users.size}`);

    } catch (error) {
      console.error('❌ Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  private handleGetRooms(socket: any) {
    try {
      const roomsList = Array.from(this.rooms.entries()).map(([id, room]) => ({
        _id: id,
        name: `Room ${id}`,
        maxParticipants: room.maxUsers,
        participants: Array.from(room.users).map(userId => ({
          id: userId,
          name: 'User-' + userId.slice(-4)
        })),
        isActive: true
      }));
      
      socket.emit('rooms:list', roomsList);
      console.log(`📋 Sent rooms list to ${socket.id}:`, roomsList.length, 'rooms');
    } catch (error) {
      console.error('❌ Error getting rooms:', error);
    }
  }

  private handleCreateRoom(socket: any, name: string, callback: (response: any) => void) {
    try {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const room = {
        id: roomId,
        users: new Set([socket.id]),
        maxUsers: 5
      };
      
      this.rooms.set(roomId, room);
      this.userRooms.set(socket.id, roomId);
      
      socket.join(roomId);
      
      console.log(`🏠 Created new room: ${roomId} by ${socket.id}`);
      
      callback({ success: true, roomId });
    } catch (error) {
      console.error('❌ Error creating room:', error);
      callback({ success: false, error: 'Failed to create room' });
    }
  }

  private handleWebRTCOffer(socket: any, data: { to: string; offer: any; roomId: string }) {
    try {
      const { to, offer, roomId } = data;
      console.log(`📡 WebRTC offer from ${socket.id} to ${to}`);
      
      this.io.to(to).emit('webrtc:offer', {
        from: socket.id,
        offer
      });
    } catch (error) {
      console.error('❌ Error handling WebRTC offer:', error);
    }
  }

  private handleWebRTCAnswer(socket: any, data: { to: string; answer: any; roomId: string }) {
    try {
      const { to, answer, roomId } = data;
      console.log(`📡 WebRTC answer from ${socket.id} to ${to}`);
      
      this.io.to(to).emit('webrtc:answer', {
        from: socket.id,
        answer
      });
    } catch (error) {
      console.error('❌ Error handling WebRTC answer:', error);
    }
  }

  private handleICECandidate(socket: any, data: { to: string; candidate: any; roomId: string }) {
    try {
      const { to, candidate, roomId } = data;
      console.log(`📡 ICE candidate from ${socket.id} to ${to}`);
      
      this.io.to(to).emit('webrtc:ice-candidate', {
        from: socket.id,
        candidate
      });
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
    }
  }

  private handleParticipantMute(socket: any, data: { roomId: string; isMuted: boolean }) {
    try {
      const { roomId, isMuted } = data;
      console.log(`🎤 User ${socket.id} ${isMuted ? 'muted' : 'unmuted'} in room ${roomId}`);
      
      socket.to(roomId).emit('participant:mute', {
        participantId: socket.id,
        isMuted
      });
    } catch (error) {
      console.error('❌ Error handling participant mute:', error);
    }
  }

  private handleParticipantSpeaking(socket: any, data: { roomId: string; isSpeaking: boolean }) {
    try {
      const { roomId, isSpeaking } = data;
      console.log(`🗣️ User ${socket.id} ${isSpeaking ? 'started' : 'stopped'} speaking in room ${roomId}`);
      
      socket.to(roomId).emit('participant:speaking', {
        participantId: socket.id,
        isSpeaking
      });
    } catch (error) {
      console.error('❌ Error handling participant speaking:', error);
    }
  }

  private handleRoomMessage(socket: any, data: { roomId: string; content: string; timestamp: number }) {
    try {
      const { roomId, content, timestamp } = data;
      const user = (socket as any).user;
      
      const message = {
        id: Date.now().toString(),
        content,
        sender: user?.id || socket.id,
        senderName: user?.name || 'User-' + socket.id.slice(-4),
        timestamp
      };
      
      console.log(`💬 Message in room ${roomId} from ${socket.id}: ${content}`);
      
      // Broadcast to all users in the room
      this.io.to(roomId).emit('room:message', message);
    } catch (error) {
      console.error('❌ Error handling room message:', error);
    }
  }

  private handleLeaveRoom(socket: any, roomId: string) {
    try {
      console.log(`👋 User ${socket.id} leaving room: ${roomId}`);
      
      const room = this.rooms.get(roomId);
      if (room) {
        room.users.delete(socket.id);
        
        // Notify other users
        socket.to(roomId).emit('participant:left', socket.id);
        
        // Update participants list for remaining users
        const remainingUsers = Array.from(room.users).map(userId => ({
          id: userId,
          name: 'User-' + userId.slice(-4),
          isSpeaking: false,
          isMuted: false,
          isSpeaker: true
        }));
        
        this.io.to(roomId).emit('participants:update', remainingUsers);
        
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
