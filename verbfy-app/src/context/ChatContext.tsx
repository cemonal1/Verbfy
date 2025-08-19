import React, { createContext, useContext, useEffect, useReducer, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '../utils/secureStorage';
import { useAuth } from './AuthContext';
import { useToast } from '../components/common/Toast';
import api from '../lib/api';
import {
  ChatState,
  ChatContextType,
  Conversation,
  Message,
  SendMessageData,
  SocketMessage,
  TypingData,
  UserTypingData
} from '../types/chat';

// Initial state
const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  unreadCount: 0,
  typingUsers: new Set()
};

// Action types
type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_CONVERSATION_LAST_MESSAGE'; payload: { conversationId: string; message: Message } }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'SET_TYPING_USER'; payload: { userId: string; isTyping: boolean } }
  | { type: 'CLEAR_TYPING_USERS' };

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    
    case 'UPDATE_CONVERSATION_LAST_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv._id === action.payload.conversationId
            ? {
                ...conv,
                lastMessage: {
                  content: action.payload.message.content,
                  sender: action.payload.message.sender._id,
                  timestamp: action.payload.message.createdAt
                },
                updatedAt: action.payload.message.createdAt
              }
            : conv
        )
      };
    
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    
    case 'SET_TYPING_USER':
      const newTypingUsers = new Set(state.typingUsers);
      if (action.payload.isTyping) {
        newTypingUsers.add(action.payload.userId);
      } else {
        newTypingUsers.delete(action.payload.userId);
      }
      return { ...state, typingUsers: newTypingUsers };
    
    case 'CLEAR_TYPING_USERS':
      return { ...state, typingUsers: new Set() };
    
    default:
      return state;
  }
}

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.verbfy.com').replace(/\/$/, '');
      const socket = io(base, {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        withCredentials: true,
        auth: {
          token: tokenStorage.getToken() || undefined
        }
      });

      socketRef.current = socket;

      // Socket event listeners
      socket.on('connect', () => {
        console.log('🔌 Connected to chat server');
      });

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from chat server');
      });

      socket.on('receiveMessage', (message: Message) => {
        dispatch({ type: 'ADD_MESSAGE', payload: message });
        dispatch({
          type: 'UPDATE_CONVERSATION_LAST_MESSAGE',
          payload: { conversationId: message.conversationId, message }
        });
      });

      socket.on('userTyping', (data: UserTypingData) => {
        dispatch({
          type: 'SET_TYPING_USER',
          payload: { userId: data.userId, isTyping: data.isTyping }
        });
      });

      socket.on('connect_error', (error: any) => {
        console.error('Socket connection error:', error?.message || error);
        showError('Failed to connect to chat server');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, user, showError]);

  // Load conversations
  const loadConversations = async () => {
    // Only load if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await api.get('/chat/conversations');
      
      if (response.data.success) {
        dispatch({ type: 'SET_CONVERSATIONS', payload: response.data.data });
      }
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load conversations';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showError(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string, page = 1) => {
    // Only load if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await api.get(`/chat/conversations/${conversationId}/messages?page=${page}&limit=50`);
      
      if (response.data.success) {
        if (page === 1) {
          dispatch({ type: 'SET_MESSAGES', payload: response.data.data.messages });
        } else {
          // For pagination, prepend older messages
          dispatch({ type: 'SET_MESSAGES', payload: [...response.data.data.messages, ...state.messages] });
        }
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load messages';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showError(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Send a message
  const sendMessage = async (data: SendMessageData) => {
    // Only send if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await api.post('/chat/messages', data);
      
      if (response.data.success) {
        const message = response.data.data;
        
        // Add message to local state
        dispatch({ type: 'ADD_MESSAGE', payload: message });
        
        // Update conversation's last message
        dispatch({
          type: 'UPDATE_CONVERSATION_LAST_MESSAGE',
          payload: { conversationId: data.conversationId, message }
        });

        // Emit message via Socket.IO
        if (socketRef.current) {
          socketRef.current.emit('sendMessage', {
            conversationId: data.conversationId,
            message
          });
        }

        showSuccess('Message sent');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send message';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showError(errorMessage);
    }
  };

  // Mark messages as read
  const markAsRead = async (conversationId: string) => {
    // Only mark as read if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      await api.patch(`/chat/conversations/${conversationId}/read`);
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Join a conversation room
  const joinConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('joinRoom', conversationId);
    }
  };

  // Leave a conversation room
  const leaveConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leaveRoom', conversationId);
    }
    dispatch({ type: 'CLEAR_TYPING_USERS' });
  };

  // Set typing indicator
  const setTyping = (conversationId: string, isTyping: boolean) => {
    if (socketRef.current && user) {
      socketRef.current.emit('typing', {
        conversationId,
        userId: user._id,
        isTyping
      });

      // Clear typing indicator after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(conversationId, false);
        }, 3000);
      }
    }
  };

  // Load unread count
  const loadUnreadCount = async () => {
    // Only load if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const response = await api.get('/chat/unread-count');
      
      if (response.data.success) {
        dispatch({ type: 'SET_UNREAD_COUNT', payload: response.data.data.unreadCount });
      }
    } catch (error: any) {
      console.error('Error loading unread count:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();
      loadUnreadCount();
    }
  }, [isAuthenticated, user]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const value: ChatContextType = {
    state,
    actions: {
      loadConversations,
      loadMessages,
      sendMessage,
      markAsRead,
      joinConversation,
      leaveConversation,
      setTyping,
      loadUnreadCount
    }
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook to use chat context
export function useChat() {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
} 