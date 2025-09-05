import React, { useState, useEffect } from 'react';
import { useVerbfyTalk } from '@/hooks/useVerbfyTalk';
import { ArrowLeftIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

interface VoiceChatRoomProps {
  roomId: string;
  onLeave: () => void;
}

export default function VoiceChatRoom({ roomId, onLeave }: VoiceChatRoomProps) {
  const {
    isConnected,
    isLoading,
    error,
    currentRoom,
    participants,
    messages,
    isMuted,
    isSpeaking,
    joinRoom,
    leaveRoom,
    sendMessage,
    toggleMute,
    setError
  } = useVerbfyTalk();

  const [microphoneGranted, setMicrophoneGranted] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Request microphone access
  const requestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        },
        video: false
      });
      
      setMicrophoneGranted(true);
      console.log('✅ Microphone access granted');
      
      // Now join the room
      if (roomId && isConnected) {
        joinRoom(roomId);
      }
    } catch (error: any) {
      console.error('❌ Failed to get microphone access:', error);
      let errorMessage = 'Microphone access denied';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Microphone not supported in this browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is already in use by another application.';
      }
      setError(errorMessage);
    }
  };

  // Join room when component mounts
  useEffect(() => {
    if (roomId && isConnected && microphoneGranted) {
      joinRoom(roomId);
    }
  }, [roomId, isConnected, microphoneGranted, joinRoom]);

  const handleLeave = () => {
    leaveRoom();
    onLeave();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      sendMessage(chatMessage);
      setChatMessage('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-white">Joining room...</p>
        </div>
      </div>
    );
  }

  if (!microphoneGranted) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <MicrophoneIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Microphone Access Required</h2>
            <p className="text-gray-300 mb-6">
              VerbfyTalk needs access to your microphone to enable voice chat. 
              Click the button below to grant permission.
            </p>
          </div>
          
          <button
            onClick={requestMicrophone}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors mb-4"
          >
            Allow Microphone Access
          </button>
          
          <div className="text-sm text-gray-400">
            <p>• Your microphone will only be used for voice chat</p>
            <p>• You can mute/unmute anytime during the conversation</p>
            <p>• No audio is recorded or stored</p>
          </div>
          
          <button
            onClick={handleLeave}
            className="mt-6 text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              joinRoom(roomId);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg mr-4"
          >
            Retry
          </button>
          <button
            onClick={handleLeave}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg"
          >
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLeave}
            className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              {currentRoom?.name || `Room ${roomId}`}
            </h1>
            <p className="text-gray-400 text-sm">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-colors relative ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : isSpeaking
                ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <MicrophoneIcon className={`w-6 h-6 ${isMuted ? 'opacity-50' : ''}`} />
            {isSpeaking && !isMuted && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Participants */}
        <div className="w-1/3 bg-gray-800 p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Participants</h2>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  participant.isSpeaking 
                    ? 'bg-green-700 border border-green-500' 
                    : 'bg-gray-700'
                }`}
              >
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  participant.isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                }`}></div>
                <span className="text-white font-medium">{participant.name}</span>
                {participant.isMuted && (
                  <MicrophoneIcon className="w-4 h-4 text-red-400 opacity-50" />
                )}
                {participant.isSpeaking && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {message.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold">{message.userName}</span>
                      <span className="text-gray-400 text-sm">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-700">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={!chatMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
