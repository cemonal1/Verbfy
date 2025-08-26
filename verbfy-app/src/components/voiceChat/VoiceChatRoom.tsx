import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { tokenStorage } from '@/utils/secureStorage';

interface VoiceChatRoomProps {
  roomId: string;
  onLeave?: () => void;
}

export default function VoiceChatRoom({ roomId, onLeave }: VoiceChatRoomProps) {
  const { user } = useAuthContext();
  const [isJoining, setIsJoining] = useState(false);
  
  const {
    isConnected,
    isConnecting,
    currentRoom,
    users,
    localStream,
    isMicOn,
    error,
    connectionStatus,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    toggleMic,
    requestMicrophone,
    clearError
  } = useVoiceChat();

  // Connect to server when component mounts
  useEffect(() => {
    const connectToServer = async () => {
      const token = tokenStorage.getToken();
      if (token && user && !isConnected && !isConnecting) {
        try {
          await connect(token);
        } catch (error) {
          console.error('❌ Failed to connect to server:', error);
        }
      }
    };

    connectToServer();
  }, [user, isConnected, isConnecting, connect]);

  // Join room when connected
  useEffect(() => {
    const joinRoomWhenReady = async () => {
      if (isConnected && !currentRoom && !isJoining) {
        setIsJoining(true);
        try {
          await joinRoom(roomId);
        } catch (error) {
          console.error('❌ Failed to join room:', error);
        } finally {
          setIsJoining(false);
        }
      }
    };

    joinRoomWhenReady();
  }, [isConnected, currentRoom, roomId, isJoining, joinRoom]);

  const handleLeaveRoom = () => {
    leaveRoom();
    disconnect();
    onLeave?.();
  };

  const handleRequestMicrophone = async () => {
    const granted = await requestMicrophone();
    if (granted && isConnected) {
      await joinRoom(roomId);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              🎤 Voice Chat Room
            </h1>
            <p className="text-gray-600 mt-1">Room ID: {roomId}</p>
            <p className="text-sm text-gray-500 mt-2">
              Maximum 5 participants • Audio only • P2P connection
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleLeaveRoom}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-red-600">❌</span>
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">{getConnectionStatusIcon()}</span>
            <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
              Server: {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${localStream ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-700">
              Microphone: {localStream ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${currentRoom ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-700">
              Room: {currentRoom ? 'Joined' : 'Not Joined'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Loading State */}
        {(isConnecting || isJoining) && (
          <div className="text-center mb-8">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {isConnecting ? 'Connecting to Server...' : 'Joining Room...'}
              </h3>
              <p className="text-gray-600">
                {isConnecting ? 'Establishing connection...' : 'Requesting microphone access...'}
              </p>
            </div>
          </div>
        )}

        {/* Microphone Permission Required */}
        {isConnected && !localStream && !isJoining && (
          <div className="text-center mb-8">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎤</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Microphone Access Required
              </h3>
              <p className="text-gray-600 mb-6">
                To join the voice chat, you need to allow microphone access. Click the button below to request permission.
              </p>
              <button
                onClick={handleRequestMicrophone}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                🎧 Allow Microphone
              </button>
            </div>
          </div>
        )}

        {/* Participants Grid */}
        {localStream && currentRoom && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
            {/* Local User */}
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {user?.name || 'You'} {isMicOn ? '🎤' : '🔇'}
              </h3>
              <p className="text-sm text-gray-600">Local</p>
              {!isMicOn && (
                <div className="mt-2 text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                  Microphone Off
                </div>
              )}
            </div>

            {/* Remote Users */}
            {users.map((user) => (
              <div key={user.socketId} className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {user.name} 🎤
                </h3>
                <p className="text-sm text-gray-600">Remote</p>
              </div>
            ))}
          </div>
        )}

        {/* Room Info */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg shadow-sm border p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Room ID:</span> {roomId}
              </div>
              <div>
                <span className="font-medium">Participants:</span> {users.length + (localStream ? 1 : 0)}/5
              </div>
              <div>
                <span className="font-medium">Connection:</span> P2P WebRTC
              </div>
              <div>
                <span className="font-medium">Audio Quality:</span> High
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Controls */}
      {localStream && currentRoom && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio Controls</h3>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleMic}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isMicOn 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {isMicOn ? '🎤 Mute' : '🔇 Unmute'}
            </button>
            
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200"
            >
              🚪 Leave Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
