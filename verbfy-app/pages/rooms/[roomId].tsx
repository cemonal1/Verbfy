import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useConversationRoomViewModel } from '@/features/conversation/viewmodel/useConversationRoomViewModel';
import { useWebRTC } from '@/features/lessonRoom/webrtc/useWebRTC';
import { useAuthContext } from '@/context/AuthContext';
import { useChatViewModel } from '@/features/chat/viewmodel/useChatViewModel';
import ChatBox from '@/features/chat/view/ChatBox';

function RoomPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { roomId } = router.query;
  const {
    currentRoom,
    getRoomDetails,
    leaveRoom,
    loading,
    participants,
  } = useConversationRoomViewModel();

  // Additional state for new features
  const [volume, setVolume] = useState(50);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    if (roomId && typeof roomId === 'string') getRoomDetails(roomId);
  }, [roomId, getRoomDetails]);

  // WebRTC: Use user.id and roomId for peerId
  const peerIds = user && roomId ? {
    self: `${user.id}-room-${roomId}`,
    remote: undefined,
  } : { self: '', remote: undefined };
  const {
    localStream,
    remoteStreams,
    isMicOn,
    isCameraOn,
    toggleMic,
    toggleCamera,
    reconnect,
    status,
    error,
    muteStates,
    videoStates,
    toggleRemoteMute,
    toggleRemoteVideo,
    isInitialized,
  } = useWebRTC(roomId as string, peerIds, participants.map(p => p.peerId));

  // Chat ViewModel
  const { messages, sendMessage } = useChatViewModel(roomId as string);

  // Dynamic refs for remote videos
  const remoteVideoRefs = useRef<{ [peerId: string]: HTMLVideoElement | null }>({});
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([peerId, stream]) => {
      const ref = remoteVideoRefs.current[peerId];
      if (ref && stream) ref.srcObject = stream;
    });
  }, [remoteStreams]);

  const handleLeaveRoom = () => {
    if (currentRoom) {
      leaveRoom(currentRoom.id);
      router.push('/dashboard');
    }
  };

  const handleToggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    // Add screen sharing logic here
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  if (loading || !currentRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading room...</p>
        </div>
      </div>
    );
  }

  // Max 5 users enforced at ViewModel level
  if (participants.length > 5) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-gray-900 text-xl font-semibold mb-2">Room Full</h1>
          <p className="text-gray-600 mb-6">This room has reached its maximum capacity.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Room: {currentRoom.name}</h1>
              <p className="text-sm text-gray-600">
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Status: <span className={`font-medium ${
                status === 'connected' ? 'text-green-600' : 
                status === 'connecting' ? 'text-yellow-600' : 
                status === 'error' ? 'text-red-600' : 'text-gray-600'
              }`}>{status}</span>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                {error}
              </div>
            )}
            <button
              onClick={reconnect}
              className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm transition-colors text-white"
            >
              Reconnect
            </button>
            <button
              onClick={handleLeaveRoom}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition-colors text-white"
            >
              Leave Room
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 bg-gray-100 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Local video */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative h-full">
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      You {isInitialized ? '✅' : '⏳'}
                    </div>
                  </div>
                  {localStream ? (
                    <video 
                      autoPlay 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover"
                      ref={el => { if (el) el.srcObject = localStream; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-gray-500 mb-2">
                          {status === 'connecting' ? '🎤 Requesting microphone access...' : 
                           status === 'error' ? '❌ Media access failed' : 
                           '⏳ Initializing...'}
                        </div>
                        {error && (
                          <div className="text-xs text-red-500 max-w-xs">
                            {error}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {!isMicOn && (
                    <div className="absolute bottom-4 left-4 z-10">
                      <div className="bg-red-500 text-white p-2 rounded-full">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {!isCameraOn && (
                    <div className="absolute bottom-4 right-4 z-10">
                      <div className="bg-red-500 text-white p-2 rounded-full">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Remote Videos */}
              {participants.filter(p => p.peerId !== peerIds.self).map(p => (
                <div key={p.peerId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="relative h-full">
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {p.name}
                      </div>
                    </div>
                    <video 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                      ref={el => { remoteVideoRefs.current[p.peerId] = el; if (el && remoteStreams[p.peerId]) el.srcObject = remoteStreams[p.peerId]; }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Control Bar */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-center space-x-4">
              {/* Mute Button */}
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full transition-colors ${
                  !isMicOn ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {!isMicOn ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  )}
                </svg>
              </button>

              {/* Volume Button */}
              <div className="relative">
                <button
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
                {showVolumeSlider && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                      className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-center text-sm text-gray-600 mt-1">{volume}%</div>
                  </div>
                )}
              </div>

              {/* Video Button */}
              <button
                onClick={toggleCamera}
                className={`p-3 rounded-full transition-colors ${
                  !isCameraOn ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {!isCameraOn ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  )}
                </svg>
              </button>

              {/* Screen Share Button */}
              <button
                onClick={handleToggleScreenShare}
                className={`p-3 rounded-full transition-colors ${
                  isScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Reconnect Button */}
              <button
                onClick={reconnect}
                className="p-3 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Leave Button */}
              <button
                onClick={handleLeaveRoom}
                className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Participants List */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Participants</h3>
            <div className="space-y-1">
              {participants.map(p => (
                <div key={p.id} className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">{p.name}</span>
                </div>
              ))}
                </div>
              </div>

          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            <ChatBox
              messages={messages}
              sendMessage={sendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomPage; 