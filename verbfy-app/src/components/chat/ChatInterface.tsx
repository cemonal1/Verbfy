import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Message, formatMessageTime } from '../../types/chat';

interface ChatInterfaceProps {
  conversationId: string;
  otherParticipant: {
    _id: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

export default function ChatInterface({ conversationId, otherParticipant }: ChatInterfaceProps) {
  const { state, actions } = useChat();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, loading, error, typingUsers } = state;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join conversation room when component mounts
  useEffect(() => {
    actions.joinConversation(conversationId);
    actions.loadMessages(conversationId);
    actions.markAsRead(conversationId);

    return () => {
      actions.leaveConversation(conversationId);
    };
  }, [conversationId]);

  // Handle typing indicator
  useEffect(() => {
    if (isTyping) {
      actions.setTyping(conversationId, true);
    } else {
      actions.setTyping(conversationId, false);
    }
  }, [isTyping, conversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    const messageData = {
      conversationId,
      content: message.trim(),
      messageType: 'text' as const
    };

    await actions.sendMessage(messageData);
    setMessage('');
    setIsTyping(false);
    
    // Focus back to input
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Set typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading messages...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          {otherParticipant.avatar ? (
            <img
              src={otherParticipant.avatar}
              alt={otherParticipant.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {otherParticipant.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {otherParticipant.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {otherParticipant.role}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Send a message to begin chatting with {otherParticipant.name}.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg._id}
              message={msg}
              isOwnMessage={msg.sender._id === user?._id}
            />
          ))
        )}
        
        {/* Typing indicator */}
        {typingUsers.has(otherParticipant._id) && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm">{otherParticipant.name} is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={1}
              maxLength={1000}
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
        
        {/* Character count */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
          {message.length}/1000
        </div>
      </div>
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

function MessageItem({ message, isOwnMessage }: MessageItemProps) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        <div
          className={`
            px-4 py-2 rounded-lg shadow-sm
            ${isOwnMessage
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            }
          `}
        >
          <p className="text-sm">{message.content}</p>
          <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {formatMessageTime(message.createdAt)}
            {isOwnMessage && (
              <span className="ml-2">
                {message.isRead ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOwnMessage ? 'order-1 ml-2' : 'order-2 mr-2'}`}>
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          {message.sender.avatar ? (
            <img
              src={message.sender.avatar}
              alt={message.sender.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {message.sender.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 