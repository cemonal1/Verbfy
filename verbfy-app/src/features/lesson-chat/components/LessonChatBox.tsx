import React, { useState, useRef } from 'react';
import { Send, Paperclip, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { useLessonChat, LessonMessage } from '../hooks/useLessonChat';
import { LessonFileUpload } from './LessonFileUpload';
import { LessonMessageItem } from './LessonMessageItem';
import { LessonParticipants } from './LessonParticipants';

interface LessonChatBoxProps {
  lessonId: string;
  className?: string;
  height?: string;
}

export const LessonChatBox: React.FC<LessonChatBoxProps> = ({
  lessonId,
  className = '',
  height = '400px'
}) => {
  const [message, setMessage] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isConnected,
    isJoined,
    messages,
    participants,
    error,
    messagesEndRef,
    sendMessage,
    shareFile,
    clearError
  } = useLessonChat({ lessonId });

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const success = sendMessage(message);
    if (success) {
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileShared = (fileId: string, fileName: string, fileSize: number) => {
    shareFile(fileId, fileName, fileSize);
    setShowFileUpload(false);
  };

  const getConnectionStatus = () => {
    if (!isConnected) return { text: 'Disconnected', color: 'text-red-500', icon: AlertCircle };
    if (!isJoined) return { text: 'Connecting...', color: 'text-yellow-500', icon: AlertCircle };
    return { text: 'Connected', color: 'text-green-500', icon: CheckCircle };
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  return (
    <div className={`flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900">Lesson Chat</h3>
          <div className="flex items-center space-x-1">
            <StatusIcon className={`w-4 h-4 ${status.color}`} />
            <span className={`text-xs ${status.color}`}>{status.text}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
            title="Show participants"
          >
            <Users className="w-4 h-4" />
            {participants.length > 0 && (
              <span className="ml-1 text-xs">{participants.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Participants Panel */}
      {showParticipants && (
        <LessonParticipants
          participants={participants}
          onClose={() => setShowParticipants(false)}
        />
      )}

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-3 space-y-3"
        style={{ height, maxHeight: height }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-sm">No messages yet</div>
            <div className="text-xs mt-1">Start the conversation!</div>
          </div>
        ) : (
          messages.map((msg) => (
            <LessonMessageItem
              key={msg.id}
              message={msg}
              lessonId={lessonId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <LessonFileUpload
          lessonId={lessonId}
          onFileShared={handleFileShared}
          onClose={() => setShowFileUpload(false)}
        />
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        {!isJoined ? (
          <div className="text-center text-gray-500 py-2">
            <div className="text-sm">
              {!isConnected ? 'Connecting to lesson chat...' : 'Joining lesson...'}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFileUpload(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="Share file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isJoined}
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || !isJoined}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};