import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { tokenStorage } from '@/utils/secureStorage';

export interface LessonMessage {
  id: string;
  lessonId: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  messageType: 'text' | 'file' | 'system';
  timestamp: string;
  fileId?: string;
}

export interface LessonFile {
  id: string;
  lessonId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploaderName: string;
  uploaderRole: string;
  timestamp: string;
}

export interface LessonParticipant {
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
}

interface UseLessonChatProps {
  lessonId: string;
  enabled?: boolean;
}

export const useLessonChat = ({ lessonId, enabled = true }: UseLessonChatProps) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<LessonMessage[]>([]);
  const [participants, setParticipants] = useState<LessonParticipant[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection
  useEffect(() => {
    const token = tokenStorage.getToken();
    if (!enabled || !user || !token || !lessonId) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    
    const newSocket = io(socketUrl, {
      path: '/verbfy-talk/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('📚 Connected to lesson chat');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('📚 Disconnected from lesson chat');
      setIsConnected(false);
      setIsJoined(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('📚 Connection error:', error);
      setError('Failed to connect to lesson chat');
      setIsConnected(false);
    });

    // Lesson events
    newSocket.on('lesson:joined', ({ lessonId: joinedLessonId }) => {
      if (joinedLessonId === lessonId) {
        setIsJoined(true);
        console.log('📚 Successfully joined lesson:', lessonId);
      }
    });

    newSocket.on('lesson:left', ({ lessonId: leftLessonId }) => {
      if (leftLessonId === lessonId) {
        setIsJoined(false);
        console.log('📚 Successfully left lesson:', lessonId);
      }
    });

    // Message events
    newSocket.on('lesson:message', (message: LessonMessage) => {
      if (message.lessonId === lessonId) {
        setMessages(prev => [...prev, message]);
      }
    });

    // File sharing events
    newSocket.on('lesson:file-shared', (fileData: LessonFile) => {
      if (fileData.lessonId === lessonId) {
        const fileMessage: LessonMessage = {
          id: fileData.id,
          lessonId: fileData.lessonId,
          userId: fileData.uploadedBy,
          userName: fileData.uploaderName,
          userRole: fileData.uploaderRole,
          message: `Shared file: ${fileData.fileName}`,
          messageType: 'file',
          timestamp: fileData.timestamp,
          fileId: fileData.fileId
        };
        setMessages(prev => [...prev, fileMessage]);
      }
    });

    // Participant events
    newSocket.on('lesson:participant-joined', (participant: LessonParticipant) => {
      setParticipants(prev => {
        const exists = prev.some(p => p.userId === participant.userId);
        if (!exists) {
          return [...prev, participant];
        }
        return prev;
      });
      
      const systemMessage: LessonMessage = {
        id: `system-${Date.now()}`,
        lessonId,
        userId: 'system',
        userName: 'System',
        userRole: 'system',
        message: `${participant.userName} joined the lesson`,
        messageType: 'system',
        timestamp: participant.timestamp
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    newSocket.on('lesson:participant-left', (participant: LessonParticipant) => {
      setParticipants(prev => prev.filter(p => p.userId !== participant.userId));
      
      const systemMessage: LessonMessage = {
        id: `system-${Date.now()}`,
        lessonId,
        userId: 'system',
        userName: 'System',
        userRole: 'system',
        message: `${participant.userName} left the lesson`,
        messageType: 'system',
        timestamp: participant.timestamp
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    // Error handling
    newSocket.on('error', (error: { message: string }) => {
      console.error('📚 Lesson chat error:', error);
      setError(error.message);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [enabled, user, lessonId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Join lesson when socket is connected
  useEffect(() => {
    if (socket && isConnected && !isJoined && lessonId) {
      socket.emit('lesson:join', { lessonId });
    }
  }, [socket, isConnected, isJoined, lessonId]);

  // Send message
  const sendMessage = useCallback((message: string) => {
    if (!socket || !isConnected || !isJoined || !message.trim()) {
      return false;
    }

    socket.emit('lesson:send-message', {
      lessonId,
      message: message.trim(),
      messageType: 'text'
    });

    return true;
  }, [socket, isConnected, isJoined, lessonId]);

  // Share file
  const shareFile = useCallback((fileId: string, fileName: string, fileSize: number) => {
    if (!socket || !isConnected || !isJoined) {
      return false;
    }

    socket.emit('lesson:file-shared', {
      lessonId,
      fileId,
      fileName,
      fileSize
    });

    return true;
  }, [socket, isConnected, isJoined, lessonId]);

  // Leave lesson
  const leaveLesson = useCallback(() => {
    if (socket && isJoined) {
      socket.emit('lesson:leave', { lessonId });
    }
  }, [socket, isJoined, lessonId]);

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    const token = tokenStorage.getToken();
    if (!token) return;
    
    try {
      const response = await fetch(`/api/lesson-chat/${lessonId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const history = await response.json();
        setMessages(history);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, [lessonId]);

  // Load chat history when joining
  useEffect(() => {
    if (isJoined) {
      loadChatHistory();
    }
  }, [isJoined, loadChatHistory]);

  return {
    // State
    isConnected,
    isJoined,
    messages,
    participants,
    error,
    messagesEndRef,
    
    // Actions
    sendMessage,
    shareFile,
    leaveLesson,
    loadChatHistory,
    
    // Utils
    clearError: () => setError(null)
  };
};