// User interface for chat participants
export interface ChatUser {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
}

// Message interface
export interface Message {
  _id: string;
  conversationId: string;
  sender: ChatUser;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Conversation interface
export interface Conversation {
  _id: string;
  otherParticipant: ChatUser;
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: string;
  };
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

// API Response interfaces
export interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
  message: string;
}

export interface ConversationResponse {
  success: boolean;
  data: Conversation;
  message: string;
}

export interface MessagesResponse {
  success: boolean;
  data: {
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
}

export interface MessageResponse {
  success: boolean;
  data: Message;
  message: string;
}

export interface SendMessageData {
  conversationId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
}

export interface UnreadCountResponse {
  success: boolean;
  data: { unreadCount: number };
  message: string;
}

// Socket.IO event interfaces
export interface SocketMessage {
  conversationId: string;
  message: Message;
}

export interface TypingData {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface UserTypingData {
  userId: string;
  isTyping: boolean;
}

// Chat state interface
export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  typingUsers: Set<string>;
}

// Chat context interface
export interface ChatContextType {
  state: ChatState;
  actions: {
    loadConversations: () => Promise<void>;
    loadMessages: (conversationId: string, page?: number) => Promise<void>;
    sendMessage: (data: SendMessageData) => Promise<void>;
    markAsRead: (conversationId: string) => Promise<void>;
    joinConversation: (conversationId: string) => void;
    leaveConversation: (conversationId: string) => void;
    setTyping: (conversationId: string, isTyping: boolean) => void;
    loadUnreadCount: () => Promise<void>;
  };
}

// Utility functions
export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
};

export const formatConversationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
};

export const truncateMessage = (content: string, maxLength: number = 50): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}; 