import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useVerbfyTalk } from '@/hooks/useVerbfyTalk';
import { tokenStorage } from '@/utils/secureStorage';
import { toast } from 'react-hot-toast';

interface VoiceChatRoomProps {
  roomId: string;
  onLeave?: () => void;
}

export default function VoiceChatRoom({ roomId, onLeave }: VoiceChatRoomProps) {
  const { user } = useAuthContext();
  const [isJoining, setIsJoining] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; username: string; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const token = tokenStorage.getToken();
  
  const {
    isConnected,
    isConnecting,
    currentRoom,
    participants,
    isMuted,
    connectionError,
    reconnectionAttempts,
    joinRoom,
    leaveRoom,
    toggleMute,
    requestMicrophone,
    disconnect
  } = useVerbfyTalk(token || '');

  // Join room when connected
  useEffect(() => {
    const joinRoomWhenReady = async () => {
      if (isConnected && !currentRoom && !isJoining) {
        setIsJoining(true);
        try {
          const success = await joinRoom(roomId);
          if (success) {
            toast.success('Joined room successfully!');
          } else {
            toast.error('Failed to join room');
          }
        } catch (error) {
          console.error('❌ Failed to join room:', error);
          toast.error('Failed to join room');
        } finally {
          setIsJoining(false);
        }
      }
    };

    joinRoomWhenReady();
  }, [isConnected, currentRoom, roomId, isJoining, joinRoom]);

  // Show connection errors
  useEffect(() => {
    if (connectionError) {
      toast.error(connectionError);
    }
  }, [connectionError]);

  // Show reconnection attempts
  useEffect(() => {
    if (reconnectionAttempts > 0) {
      toast.loading(`Reconnecting... (Attempt ${reconnectionAttempts}/5)`, { id: 'reconnecting' });
    } else {
      toast.dismiss('reconnecting');
    }
  }, [reconnectionAttempts]);

  const handleLeaveRoom = () => {
    leaveRoom();
    disconnect();
    onLeave?.();
  };

  const handleRequestMicrophone = async () => {
    const granted = await requestMicrophone();
    if (granted) {
      toast.success('Microphone access granted!');
      if (isConnected) {
        await joinRoom(roomId);
      }
    } else {
      toast.error('Microphone access denied');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      // Add message to local state
      const newMessage = {
        id: Date.now().toString(),
        text: inputMessage,
        username: user?.name || 'You',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
      
      // TODO: Send message via Socket.IO
    }
  };

  const getConnectionStatusColor = () => {
    if (isConnecting) return 'text-yellow-600';
    if (isConnected) return 'text-green-600';
    if (connectionError) return 'text-red-600';
    return 'text-gray-600';
  };

  const getConnectionStatusIcon = () => {
    if (isConnecting) return '🟡';
    if (isConnected) return '🟢';
    if (connectionError) return '🔴';
    return '⚪';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`text-2xl ${getConnectionStatusColor()}`}>
              {getConnectionStatusIcon()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentRoom?.name || `Room: ${roomId}`}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isConnecting ? 'Connecting...' : 
                 isConnected ? `${participants.length} participants` : 
                 'Disconnected'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!isConnected && (
              <button
                onClick={handleRequestMicrophone}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Enable Microphone
              </button>
            )}
            
            <button
              onClick={toggleMute}
              disabled={!isConnected}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isMuted 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            
            <button
              onClick={handleLeaveRoom}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participants */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Participants ({participants.length})
            </h2>
            <div className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    participant.isSpeaking ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {participant.name}
                  </span>
                  {participant.isMuted && (
                    <span className="text-xs text-red-500">🔇</span>
                  )}
                  {participant.isSpeaking && (
                    <span className="text-xs text-green-500">🎤</span>
                  )}
                </div>
              ))}
              {participants.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No participants yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Chat
            </h2>
            
            {/* Messages */}
            <div className="h-64 overflow-y-auto mb-4 space-y-2">
              {messages.map((message) => (
                <div key={message.id} className="text-sm">
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {message.username}:
                  </span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">
                    {message.text}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No messages yet. Start the conversation!
                </p>
              )}
            </div>
            
            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!isConnected || !inputMessage.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {connectionError && (
        <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Connection Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {connectionError}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
