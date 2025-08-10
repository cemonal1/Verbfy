import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from './utils/jwt';
import { Reservation } from './models/Reservation';
import UserModel from './models/User';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  handshake: {
    auth: {
      token?: string;
    };
    headers: {
      authorization?: string;
    };
  };
  rooms: Set<string>;
  to: (room: string) => {
    emit: (event: string, data: any) => void;
  };
}

interface Socket {
  id: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  disconnect: () => void;
}

// Authentication middleware for Socket.IO
const authenticateSocket = async (socket: AuthenticatedSocket, token: string): Promise<boolean> => {
  try {
    const decoded = verifyToken(token) as any;
    
    if (!decoded || !decoded.id || !decoded.name || !decoded.email || !decoded.role) {
      return false;
    }

    // Verify user exists in database
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return false;
    }

    socket.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    return true;
  } catch (error) {
    return false;
  }
};

// Validate room access for reservations
const validateRoomAccess = async (userId: string, reservationId: string): Promise<boolean> => {
  try {
    console.log(`🔍 Validating access for user ${userId} to reservation ${reservationId}`);
    
    const reservation = await Reservation.findById(reservationId)
      .populate('teacher', 'name email')
      .populate('student', 'name email');

    if (!reservation) {
      console.log(`❌ Reservation ${reservationId} not found`);
      return false;
    }

    console.log(`📋 Reservation found: Teacher ${reservation.teacher._id}, Student ${reservation.student._id}`);

    // Check if user is the teacher or student for this reservation
    const isTeacher = reservation.teacher._id.toString() === userId;
    const isStudent = reservation.student._id.toString() === userId;

    console.log(`👤 User ${userId} - Is teacher: ${isTeacher}, Is student: ${isStudent}`);

    if (!isTeacher && !isStudent) {
      console.log(`❌ User ${userId} is not part of this reservation`);
      return false;
    }

    // Check reservation status
    console.log(`📊 Reservation status: ${reservation.status}`);
    if (!['booked', 'completed'].includes(reservation.status)) {
      console.log(`❌ Reservation status ${reservation.status} is not allowed`);
      return false;
    }

    // Check if lesson has ended - NO ONE should access after end time
    const now = new Date();
    const lessonDate = new Date(reservation.actualDate);
    const [endHour, endMin] = reservation.endTime.split(':').map(Number);
    const lessonEndTime = new Date(lessonDate);
    lessonEndTime.setHours(endHour, endMin, 0, 0);

    console.log(`⏰ Current time: ${now.toISOString()}`);
    console.log(`⏰ Lesson end time: ${lessonEndTime.toISOString()}`);
    console.log(`⏰ Lesson has ended: ${now > lessonEndTime}`);

    // If lesson has ended, deny access to everyone
    if (now > lessonEndTime) {
      console.log(`❌ Lesson ended at ${lessonEndTime.toISOString()}, current time: ${now.toISOString()}`);
      return false;
    }

    // For students: apply time window restriction (can only join within 15 minutes before start)
    if (isStudent) {
      const [startHour, startMin] = reservation.startTime.split(':').map(Number);
      const lessonStartTime = new Date(lessonDate);
      lessonStartTime.setHours(startHour, startMin, 0, 0);
      
      const timeBeforeStart = (lessonStartTime.getTime() - now.getTime()) / (1000 * 60); // minutes
      const timeWindow = process.env.NODE_ENV === 'production' ? 15 : 1440; // 15 min in prod, 24 hours in dev for testing
      
      console.log(`⏰ Student time check - Time before start: ${timeBeforeStart} minutes, Window: ${timeWindow} minutes`);
      
      // Students can only join within the time window before the lesson starts
      if (timeBeforeStart > timeWindow) {
        console.log(`❌ Student cannot join yet. Lesson starts in ${timeBeforeStart} minutes, window: ${timeWindow} minutes`);
        return false;
      }
    }

    console.log(`✅ Access granted for user ${userId} (${isTeacher ? 'teacher' : 'student'})`);
    return true;
  } catch (error) {
    console.error('❌ Error validating room access:', error);
    return false;
  }
};

export const setupSocketServer = (server: HTTPServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : "http://localhost:3000",
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication failed: No token provided'));
    }

    const isAuthenticated = await authenticateSocket(socket, token);
    if (!isAuthenticated) {
      return next(new Error('Authentication failed: Invalid token'));
    }

    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.user?.name})`);

    // Join lesson room
    socket.on('join-room', async (data: { reservationId: string }) => {
      const { reservationId } = data;
      
      console.log(`🔌 Join room request: User ${socket.user?.name} (${socket.user?.id}) trying to join room ${reservationId}`);
      
      if (!reservationId) {
        console.log('❌ No reservation ID provided');
        socket.emit('error', { message: 'Reservation ID is required' });
        return;
      }

      console.log('🔍 Validating room access...');
      const hasAccess = await validateRoomAccess(socket.user!.id, reservationId);
      console.log(`🔍 Access validation result for ${socket.user?.name}: ${hasAccess}`);
      
      if (!hasAccess) {
        console.log(`❌ Access denied for user ${socket.user?.name} to room ${reservationId}`);
        socket.emit('error', { message: 'Access denied to this lesson room' });
        return;
      }

      console.log(`✅ Access granted for user ${socket.user?.name} to room ${reservationId}`);

      // Leave any existing rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          console.log(`🚪 Leaving room: ${room}`);
          socket.leave(room);
        }
      });

      // Join the lesson room
      socket.join(reservationId);
      console.log(`✅ User ${socket.user!.name} joined room ${reservationId}`);

      // Notify other users in the room
      socket.to(reservationId).emit('user-joined', {
        userId: socket.user!.id,
        userName: socket.user!.name,
        userRole: socket.user!.role
      });

      // Send room info to the joining user
      const roomUsers = Array.from(io.sockets.adapter.rooms.get(reservationId) || [])
        .map(socketId => {
          const userSocket = io.sockets.sockets.get(socketId) as AuthenticatedSocket;
          return userSocket?.user ? {
            id: userSocket.user.id,
            name: userSocket.user.name,
            role: userSocket.user.role
          } : null;
        })
        .filter(Boolean);

      console.log(`📋 Room ${reservationId} users:`, roomUsers);

      socket.emit('room-info', {
        roomId: reservationId,
        users: roomUsers
      });
    });

    // WebRTC signaling - room-based
    socket.on('offer', (data: { roomId: string; offer: any }) => {
      socket.to(data.roomId).emit('offer', {
        userId: socket.user!.id,
        userName: socket.user!.name,
        offer: data.offer
      });
    });

    socket.on('answer', (data: { roomId: string; answer: any; targetUserId: string }) => {
      // Send answer to specific user in the room
      const targetSocket = Array.from(io.sockets.adapter.rooms.get(data.roomId) || [])
        .map(socketId => io.sockets.sockets.get(socketId) as AuthenticatedSocket)
        .find(s => s?.user?.id === data.targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('answer', {
          userId: socket.user!.id,
          userName: socket.user!.name,
          answer: data.answer
        });
      }
    });

    socket.on('ice-candidate', (data: { roomId: string; candidate: any }) => {
      socket.to(data.roomId).emit('ice-candidate', {
        userId: socket.user!.id,
        candidate: data.candidate
      });
    });

    // Chat messages
    socket.on('chat-message', (data: { roomId: string; message: string }) => {
      const { roomId, message } = data;
      
      // Validate room access
      socket.rooms.forEach(room => {
        if (room === roomId) {
          socket.to(roomId).emit('chat-message', {
            userId: socket.user!.id,
            userName: socket.user!.name,
            userRole: socket.user!.role,
            message,
            timestamp: new Date().toISOString()
          });
        }
      });
    });

    // Screen sharing
    socket.on('screen-share-start', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('screen-share-start', {
        userId: socket.user!.id,
        userName: socket.user!.name
      });
    });

    socket.on('screen-share-stop', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('screen-share-stop', {
        userId: socket.user!.id,
        userName: socket.user!.name
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (user: ${socket.user?.name})`);
      
      // Notify other users in all rooms that this user was in
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.to(room).emit('user-left', {
            userId: socket.user!.id,
            userName: socket.user!.name,
            userRole: socket.user!.role
          });
        }
      });
    });
  });
}; 