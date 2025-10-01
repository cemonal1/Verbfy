import { useState, useCallback, useEffect } from 'react';
import { useVerbfyTalk } from '@/hooks/useVerbfyTalk';

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

export function useChatViewModel(roomId: string): UseChatViewModelReturn {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const { 
    messages: verbfyMessages, 
    sendMessage: verbfySendMessage, 
    isConnected,
    joinRoom,
    leaveRoom 
  } = useVerbfyTalk();

  // Join room when component mounts and socket is connected
  useEffect(() => {
    if (roomId && isConnected) {
      console.log('🔗 Joining VerbfyTalk room:', roomId);
      joinRoom(roomId);
    }
    
    return () => {
      if (roomId) {
        console.log('🚪 Leaving VerbfyTalk room:', roomId);
        leaveRoom();
      }
    };
  }, [roomId, isConnected, joinRoom, leaveRoom]);

  // Convert VerbfyTalk messages to ChatMessage format
  const messages: ChatMessage[] = verbfyMessages.map(msg => ({
    id: msg.id,
    userId: msg.userId,
    userName: msg.userName,
    message: msg.message,
    timestamp: new Date(msg.timestamp),
    type: 'text' as const,
  }));

  const sendMessage = useCallback((message: string) => {
    if (isConnected && roomId) {
      console.log('📤 Sending message via VerbfyTalk:', message);
      verbfySendMessage(message);
    } else {
      console.log('📤 Sending message locally (not connected):', message);
      // Fallback to local state if not connected
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        userId: 'current-user',
        userName: 'You',
        message,
        timestamp: new Date(),
        type: 'text'
      };
      
      setLocalMessages(prev => [...prev, newMessage]);
    }
  }, [isConnected, roomId, verbfySendMessage]);

  // Use VerbfyTalk messages if connected, otherwise use local messages
  const finalMessages = isConnected ? messages : localMessages;

  console.log('💬 Chat state:', { 
    isConnected, 
    roomId, 
    messageCount: finalMessages.length,
    verbfyMessageCount: verbfyMessages.length 
  });

  return {
    messages: finalMessages,
    sendMessage,
    isConnected
  };
}