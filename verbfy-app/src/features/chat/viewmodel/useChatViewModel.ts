import { useState, useCallback } from 'react';

interface Message {
  id: string;
  text: string;
  username: string;
  timestamp: Date;
}

export function useChatViewModel(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = useCallback(async (text: string) => {
    // Placeholder implementation
    console.log('Sending message:', text, 'to room:', roomId);
    
    // Add message to local state for now
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      username: 'You',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, [roomId]);

  return {
    messages,
    sendMessage,
  };
} 