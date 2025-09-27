import { useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system';
}

export interface UseChatViewModelReturn {
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
  isConnected: boolean;
}

export function useChatViewModel(_roomId: string): UseChatViewModelReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected] = useState(false);

  const sendMessage = useCallback((message: string) => {
    // For now, just add the message locally
    // In a real implementation, this would send via WebSocket
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'You',
      message,
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, newMessage]);
  }, []);

  return {
    messages,
    sendMessage,
    isConnected
  };
}