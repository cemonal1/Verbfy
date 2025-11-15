import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createLogger } from './utils/logger';

const verbfyTalkLogger = createLogger('VerbfyTalk');

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
  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set of roomIds

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
      path: '/verbfy-talk/socket.io',
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin (mobile apps, etc.)
          if (!origin) return callback(null, true);
          
          // Check if origin is in allowed list
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }

          verbfyTalkLogger.warn('CORS blocked origin', { origin, allowedOrigins });
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
        verbfyTalkLogger.debug('Connection request', {
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
          verbfyTalkLogger.warn('Connection attempt without token');
          return next(new Error('Unauthorized - No token provided'));
        }

        const { verifyToken } = require('../utils/jwt');
        try {
          const payload = verifyToken(token);
          (socket as any).user = payload;
          verbfyTalkLogger.info('User authenticated', { userId: payload.id });
          next();
        } catch (jwtError: any) {
          verbfyTalkLogger.warn('JWT verification failed', { error: jwtError.message });
          return next(new Error('Unauthorized - Invalid token'));
        }
      } catch (e) {
        verbfyTalkLogger.error('Middleware error', e);
        return next(new Error('Unauthorized - Middleware error'));
      }
    });

    this.setupEventHandlers();
    verbfyTalkLogger.info('VerbfyTalk P2P Audio Server initialized');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      verbfyTalkLogger.info('User connected', { socketId: socket.id });

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

      socket.on('message:send', (data: { roomId: string; message: string }) => {
        this.handleMessageSend(socket, data);
      });

      // Lesson chat events
      socket.on('lesson:send-message', (data: { lessonId: string; message: string; messageType?: string }) => {
        this.handleLessonMessage(socket, data);
      });

      socket.on('lesson:file-shared', (data: { lessonId: string; fileId: string; fileName: string; fileSize: number }) => {
        this.handleLessonFileShared(socket, data);
      });

      socket.on('lesson:join', (data: { lessonId: string }) => {
        this.handleJoinLesson(socket, data);
      });

      socket.on('lesson:leave', (data: { lessonId: string }) => {
        this.handleLeaveLesson(socket, data);
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinRoom(socket: any, roomId: string) {
    try {
      verbfyTalkLogger.info('User attempting to join room', { socketId: socket.id, roomId });

      // Check if user is already in this room
      const userRoomSet = this.userRooms.get(socket.id) || new Set();
      if (userRoomSet.has(roomId)) {
        verbfyTalkLogger.warn('User already in room', { socketId: socket.id, roomId });
        socket.emit('room:already-joined', { roomId });
        return;
      }

      // Get or create room
      let room = this.rooms.get(roomId);
      if (!room) {
        room = {
          id: roomId,
          users: new Set(),
          maxUsers: 5
        };
        this.rooms.set(roomId, room);
        verbfyTalkLogger.info('Created new room', { roomId });
      }

      // Check if room is full
      if (room.users.size >= room.maxUsers) {
        verbfyTalkLogger.warn('Room is full', { roomId, currentUsers: room.users.size, maxUsers: room.maxUsers });
        socket.emit('roomFull', {
          message: 'Room is full (maximum 5 users)',
          roomId
        });
        return;
      }

      // Join the room
      socket.join(roomId);
      room.users.add(socket.id);
      
      // Add room to user's room set
      if (!this.userRooms.has(socket.id)) {
        this.userRooms.set(socket.id, new Set());
      }
      this.userRooms.get(socket.id)!.add(roomId);

      // Get user info from authentication
      const user = (socket as any).user;
      const userInfo = {
        userId: user?.id || socket.id,
        userName: user?.name || 'User-' + socket.id.slice(-4),
        roomId
      };

      // Notify other users in the room
      socket.to(roomId).emit('participant:joined', {
        participant: userInfo,
        roomId: roomId
      });

      // Send room info to the joining user
      const roomUsers = Array.from(room.users).map(userId => ({
        id: userId,
        name: 'User-' + userId.slice(-4),
        isSpeaking: false,
        isMuted: false,
        isSpeaker: true
      }));

      socket.emit('room:joined', {
        room: {
          _id: roomId,
          name: `Room ${roomId}`,
          maxParticipants: room.maxUsers,
          participants: roomUsers,
          isActive: true
        },
        roomId: roomId
      });

      // Update participants list for all users in the room
      socket.to(roomId).emit('participants:update', roomUsers);
      socket.emit('participants:update', roomUsers);

      verbfyTalkLogger.info('User joined room successfully', { socketId: socket.id, roomId, totalUsers: room.users.size });

    } catch (error) {
      verbfyTalkLogger.error('Error joining room', error);
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
      verbfyTalkLogger.info('Sent rooms list', { socketId: socket.id, roomCount: roomsList.length });
    } catch (error) {
      verbfyTalkLogger.error('Error getting rooms', error);
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
      this.userRooms.set(socket.id, new Set([roomId]));

      socket.join(roomId);

      verbfyTalkLogger.info('Created new room', { roomId, socketId: socket.id });

      callback({ success: true, roomId });
    } catch (error) {
      verbfyTalkLogger.error('Error creating room', error);
      callback({ success: false, error: 'Failed to create room' });
    }
  }

  private handleWebRTCOffer(socket: any, data: { to: string; offer: any; roomId: string }) {
    try {
      const { to, offer, roomId } = data;
      verbfyTalkLogger.debug('WebRTC offer', { from: socket.id, to, roomId });

      this.io.to(to).emit('webrtc:offer', {
        from: socket.id,
        offer,
        roomId
      });
    } catch (error) {
      verbfyTalkLogger.error('Error handling WebRTC offer', error);
    }
  }

  private handleWebRTCAnswer(socket: any, data: { to: string; answer: any; roomId: string }) {
    try {
      const { to, answer, roomId } = data;
      verbfyTalkLogger.debug('WebRTC answer', { from: socket.id, to, roomId });

      this.io.to(to).emit('webrtc:answer', {
        from: socket.id,
        answer,
        roomId
      });
    } catch (error) {
      verbfyTalkLogger.error('Error handling WebRTC answer', error);
    }
  }

  private handleICECandidate(socket: any, data: { to: string; candidate: any; roomId: string }) {
    try {
      const { to, candidate, roomId } = data;
      verbfyTalkLogger.debug('ICE candidate', { from: socket.id, to, roomId });

      this.io.to(to).emit('webrtc:ice-candidate', {
        from: socket.id,
        candidate,
        roomId
      });
    } catch (error) {
      verbfyTalkLogger.error('Error handling ICE candidate', error);
    }
  }

  private handleParticipantMute(socket: any, data: { roomId: string; isMuted: boolean }) {
    try {
      const { roomId, isMuted } = data;
      verbfyTalkLogger.debug('Participant mute state changed', { socketId: socket.id, roomId, isMuted });

      socket.to(roomId).emit('participant:mute', {
        participantId: socket.id,
        isMuted
      });
    } catch (error) {
      verbfyTalkLogger.error('Error handling participant mute', error);
    }
  }

  private handleParticipantSpeaking(socket: any, data: { roomId: string; isSpeaking: boolean }) {
    try {
      const { roomId, isSpeaking } = data;
      verbfyTalkLogger.debug('Participant speaking state changed', { socketId: socket.id, roomId, isSpeaking });

      socket.to(roomId).emit('participant:speaking', {
        participantId: socket.id,
        isSpeaking
      });
    } catch (error) {
      verbfyTalkLogger.error('Error handling participant speaking', error);
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

      verbfyTalkLogger.info('Room message sent', { roomId, socketId: socket.id, messageLength: content.length });

      // Broadcast to all users in the room
      this.io.to(roomId).emit('room:message', message);
    } catch (error) {
      verbfyTalkLogger.error('Error handling room message', error);
    }
  }

  private handleMessageSend(socket: any, data: { roomId: string; message: string }) {
    try {
      const { roomId, message } = data;
      const user = (socket as any).user;

      if (!user) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      const messageData = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        message: message.trim(),
        timestamp: new Date().toISOString()
      };

      verbfyTalkLogger.info('VerbfyTalk message sent', { roomId, userId: user.id, userName: user.name, messageLength: message.length });

      // Broadcast to all users in the room including the sender
      this.io.to(roomId).emit('message:received', {
        message: messageData,
        roomId: roomId
      });
    } catch (error) {
      verbfyTalkLogger.error('Error handling message send', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private handleLessonMessage(socket: any, data: { lessonId: string; message: string; messageType?: string }) {
    try {
      const { lessonId, message, messageType = 'text' } = data;
      const user = (socket as any).user;
      
      if (!user) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      const messageData = {
        id: Date.now().toString(),
        lessonId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        message,
        messageType,
        timestamp: new Date().toISOString()
      };

      verbfyTalkLogger.info('Lesson message sent', { lessonId, userId: user.id, userName: user.name, messageType, messageLength: message.length });

      // Broadcast to all users in the lesson
      this.io.to(`lesson:${lessonId}`).emit('lesson:message', messageData);
    } catch (error) {
      verbfyTalkLogger.error('Error handling lesson message', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private handleLessonFileShared(socket: any, data: { lessonId: string; fileId: string; fileName: string; fileSize: number }) {
    try {
      const { lessonId, fileId, fileName, fileSize } = data;
      const user = (socket as any).user;

      if (!user) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      const fileData = {
        id: Date.now().toString(),
        lessonId,
        fileId,
        fileName,
        fileSize,
        uploadedBy: user.id,
        uploaderName: user.name,
        uploaderRole: user.role,
        timestamp: new Date().toISOString()
      };

      verbfyTalkLogger.info('File shared in lesson', { lessonId, userId: user.id, userName: user.name, fileName, fileSize });

      // Broadcast to all users in the lesson
      this.io.to(`lesson:${lessonId}`).emit('lesson:file-shared', fileData);
    } catch (error) {
      verbfyTalkLogger.error('Error handling lesson file share', error);
      socket.emit('error', { message: 'Failed to share file' });
    }
  }

  private handleJoinLesson(socket: any, data: { lessonId: string }) {
    try {
      const { lessonId } = data;
      const user = (socket as any).user;
      
      if (!user) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      const lessonRoom = `lesson:${lessonId}`;
      socket.join(lessonRoom);

      verbfyTalkLogger.info('User joined lesson', { lessonId, userId: user.id, userName: user.name, userRole: user.role });

      // Notify other participants
      socket.to(lessonRoom).emit('lesson:participant-joined', {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        timestamp: new Date().toISOString()
      });

      // Confirm join to the user
      socket.emit('lesson:joined', { lessonId });
    } catch (error) {
      verbfyTalkLogger.error('Error handling lesson join', error);
      socket.emit('error', { message: 'Failed to join lesson' });
    }
  }

  private handleLeaveLesson(socket: any, data: { lessonId: string }) {
    try {
      const { lessonId } = data;
      const user = (socket as any).user;

      if (!user) {
        return;
      }

      const lessonRoom = `lesson:${lessonId}`;
      socket.leave(lessonRoom);

      verbfyTalkLogger.info('User left lesson', { lessonId, userId: user.id, userName: user.name, userRole: user.role });

      // Notify other participants
      socket.to(lessonRoom).emit('lesson:participant-left', {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        timestamp: new Date().toISOString()
      });

      // Confirm leave to the user
      socket.emit('lesson:left', { lessonId });
    } catch (error) {
      verbfyTalkLogger.error('Error handling lesson leave', error);
    }
  }

  private handleLeaveRoom(socket: any, roomId: string) {
    try {
      verbfyTalkLogger.info('User leaving room', { socketId: socket.id, roomId });

      const room = this.rooms.get(roomId);
      if (room) {
        room.users.delete(socket.id);

        // Notify other users
        socket.to(roomId).emit('participant:left', {
          participantId: socket.id,
          roomId: roomId
        });

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
          verbfyTalkLogger.info('Removed empty room', { roomId });
        } else {
          verbfyTalkLogger.debug('Room participant count updated', { roomId, userCount: room.users.size });
        }
      }

      // Remove room from user's room set
      const userRoomSet = this.userRooms.get(socket.id);
      if (userRoomSet) {
        userRoomSet.delete(roomId);
        if (userRoomSet.size === 0) {
          this.userRooms.delete(socket.id);
        }
      }

      socket.leave(roomId);

    } catch (error) {
      verbfyTalkLogger.error('Error leaving room', error);
    }
  }

  private handleDisconnect(socket: any) {
    try {
      verbfyTalkLogger.info('User disconnected', { socketId: socket.id });

      // Find and remove user from all their rooms
      const userRoomSet = this.userRooms.get(socket.id);
      if (userRoomSet) {
        // Leave all rooms the user was connected to
        for (const roomId of userRoomSet) {
          this.handleLeaveRoom(socket, roomId);
        }
      }

    } catch (error) {
      verbfyTalkLogger.error('Error handling disconnect', error);
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

    verbfyTalkLogger.info('Room statistics', stats);
    return stats;
  }

  // Clean up empty rooms (optional maintenance)
  public cleanupEmptyRooms() {
    let cleanedCount = 0;
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.size === 0) {
        this.rooms.delete(roomId);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      verbfyTalkLogger.info('Cleaned up empty rooms', { count: cleanedCount });
    }
  }
}

// Export factory function
export const createVerbfyTalkServer = (server: HTTPServer) => {
  return new VerbfyTalkServer(server);
};
