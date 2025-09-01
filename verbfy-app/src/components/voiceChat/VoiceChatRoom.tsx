import React, { useState, useEffect, useRef } from 'react';
import { useVerbfyTalk } from '@/hooks/useVerbfyTalk';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { Socket } from 'socket.io-client';
import {
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface VoiceChatRoomProps {
  roomId: string;
  onLeave: () => void;
}



export default function VoiceChatRoom({ roomId, onLeave }: VoiceChatRoomProps) {
  const { user } = useAuthContext();
  
  // Voice chat socket (using VerbfyTalk socket)
  const [socket] = useState<Socket | null>(null);
  
  // Room state
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // VerbfyTalk setup
  const {
    localStream,
    remoteStreams,
    isMuted,
    isSpeaker,
    toggleMute,
    toggleSpeaker,
    status,
    connectionError,
    isInitialized,
    participants: verbfyParticipants,
    messages: verbfyMessages,
    sendMessage: sendVerbfyMessage,
    joinRoom,
    leaveRoom: leaveVerbfyRoom,
  } = useVerbfyTalk(localStorage.getItem('token') || '');

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize room
  useEffect(() => {
    if (user && roomId) {
      initializeRoom();
    }
  }, [user, roomId]);

  // Update local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [verbfyMessages]);

  const initializeRoom = async () => {
    try {
      setIsLoading(true);
      
      // Join room via VerbfyTalk
      await joinRoom(roomId);
        
      // Listen for room updates
      voiceSocket.on('room-updated', (data) => {
        setRoomInfo(data.room);
      });

      // Listen for participant updates
      voiceSocket.on('participant-joined', (participant) => {
        toast.success(`${participant.name} joined the room`);
      });

      voiceSocket.on('participant-left', (participantId) => {
        toast('A participant left the room');
      });

      // Listen for room messages
      voiceSocket.on('room-message', (message) => {
        // Messages are handled by useVerbfyTalk hook
      });

    } catch (error) {
      console.error('Failed to initialize room:', error);
      toast.error('Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      sendVerbfyMessage(chatMessage);
      setChatMessage('');
    }
  };



  const handleLeaveRoom = () => {
    leaveVerbfyRoom();
    onLeave();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Joining room...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to join room: {connectionError}</p>
          <button
            onClick={handleLeaveRoom}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
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
            onClick={handleLeaveRoom}
            className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-white font-semibold text-lg">
              {roomInfo?.name || `Room ${roomId}`}
            </h1>
            <p className="text-gray-400 text-sm">
              {verbfyParticipants.length} participants
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-2 rounded-lg ${
              showParticipants ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <UsersIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-lg ${
              showChat ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {user?.name} (You)
              </div>
              {isMuted && (
                <div className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded">
                  <MicrophoneIcon className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Remote Videos */}
            {verbfyParticipants.filter(p => p.id !== user?.id).map((participant) => (
              <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white text-lg font-semibold">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white text-sm">{participant.name}</p>
                    {participant.isSpeaking && (
                      <div className="mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
                {participant.isMuted && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded">
                    <MicrophoneIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700">
          {/* Participants */}
          {showParticipants && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold mb-3">Participants</h3>
              <div className="space-y-2">
                {verbfyParticipants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3 p-2 rounded bg-gray-700">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        {participant.name}
                        {participant.id === user?.id && ' (You)'}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {participant.isSpeaker ? 'Speaker' : 'Listener'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <MicrophoneIcon className={`w-4 h-4 ${!participant.isMuted ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat */}
          {showChat && (
            <div className="flex-1 flex flex-col h-full">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-white font-semibold">Chat</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
                <div className="space-y-3">
                  {verbfyMessages.map((message, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-400 text-sm font-semibold">
                          {message.sender === user?.id ? 'You' : message.senderName}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-white text-sm">{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex items-center justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full ${
            !isMuted ? 'bg-gray-600 text-white' : 'bg-red-500 text-white'
          } hover:opacity-80 transition-colors`}
        >
          <MicrophoneIcon className="w-6 h-6" />
        </button>

        <button
          onClick={toggleSpeaker}
          className={`p-3 rounded-full ${
            isSpeaker ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
          } hover:opacity-80 transition-colors`}
        >
          {isSpeaker ? (
            <SpeakerWaveIcon className="w-6 h-6" />
          ) : (
            <SpeakerXMarkIcon className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={handleLeaveRoom}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
