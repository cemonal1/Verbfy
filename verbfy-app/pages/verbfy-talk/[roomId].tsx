import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useI18n } from '@/lib/i18n';
import { verbfyTalkAPI } from '@/lib/api';
import { 
  UsersIcon, 
  LockClosedIcon, 
  GlobeAltIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ClockIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';

export default function VerbfyTalkRoomPage() {
  const router = useRouter();
  const { roomId } = router.query as { roomId?: string };
  const { t } = useI18n();
  const [room, setRoom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinPassword, setJoinPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // WebRTC states
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [participants, setParticipants] = useState<any[]>([]);
  const [microphoneError, setMicrophoneError] = useState<{ message: string; showRetry: boolean } | null>(null);
  
  // WebRTC refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const load = async () => {
      try {
        const res: any = await verbfyTalkAPI.getRoomDetails(roomId);
        setRoom(res.data || res);
        // Check if user is already in the room
        if (res.data?.participants || res?.participants) {
          const participants = res.data?.participants || res?.participants;
          const isInRoom = participants.some((p: any) => p.isActive);
          setJoined(isInRoom);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roomId]);

  // WebRTC Audio Functions
  const initializeAudio = async () => {
    try {
      console.log('🎤 Requesting microphone permission...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access not supported in this browser');
      }

      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        throw new Error('Microphone access requires a secure context (HTTPS or localhost)');
      }

      // Try to get microphone permissions first
      try {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        console.log('🔍 Microphone permission status:', permission.state);
        
        if (permission.state === 'denied') {
          throw new Error('Microphone permission permanently denied. Please enable it in browser settings.');
        }
      } catch (permError) {
        console.log('⚠️ Could not check permission status, proceeding with getUserMedia');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('✅ Microphone permission granted');
      localStreamRef.current = stream;
      
      // Create audio context for level monitoring
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);
      
      // Monitor audio levels
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          setIsSpeaking(average > 30);
        }
        requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();
      
      console.log('🎤 Audio initialized successfully');
    } catch (error: any) {
      console.error('❌ Failed to initialize audio:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to access microphone';
      let showRetryButton = true;
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Microphone access not supported in this browser.';
        showRetryButton = false;
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is already in use by another application.';
      } else if (error.message.includes('secure context')) {
        errorMessage = 'Microphone access requires HTTPS. Please use https://verbfy.com instead of http.';
        showRetryButton = false;
      } else if (error.message.includes('permanently denied')) {
        errorMessage = 'Microphone access permanently blocked. Please enable it in browser settings: Chrome Settings > Privacy > Site Settings > Microphone > Allow.';
        showRetryButton = false;
      }
      
      // Show error to user with better UI
      setMicrophoneError({ message: errorMessage, showRetry: showRetryButton });
      throw error;
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const handleJoin = async () => {
    if (!roomId) return;
    
    if (room?.isPrivate && !joinPassword) {
      setShowPasswordModal(true);
      return;
    }
    
    try {
      setJoining(true);
      const res: any = await verbfyTalkAPI.joinRoom(roomId, { password: joinPassword });
      if (res.success) {
        setJoined(true);
        setJoinPassword('');
        setShowPasswordModal(false);
        
        // Initialize WebRTC audio after joining
        await initializeAudio();
        
        // Reload room data to show updated participants
        const updatedRes = await verbfyTalkAPI.getRoomDetails(roomId);
        setRoom(updatedRes.data || updatedRes);
      }
    } catch (error: any) {
      console.error('Failed to join room:', error);
      alert(error.response?.data?.message || 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!roomId) return;
    try {
      // Stop all audio streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close peer connections
      peerConnectionsRef.current.forEach(connection => connection.close());
      peerConnectionsRef.current.clear();
      
      await verbfyTalkAPI.leaveRoom(roomId);
      setJoined(false);
      
      // Navigate back to rooms list
      router.push('/verbfy-talk');
    } catch (error: any) {
      console.error('Failed to leave room:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Beginner':
        return <AcademicCapIcon className="w-4 h-4 text-green-500" />;
      case 'Intermediate':
        return <AcademicCapIcon className="w-4 h-4 text-yellow-500" />;
      case 'Advanced':
        return <AcademicCapIcon className="w-4 h-4 text-red-500" />;
      default:
        return <AcademicCapIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Loading Room...">
        <div className="p-8 text-center text-gray-500">Loading room details...</div>
      </DashboardLayout>
    );
  }

  if (!room) {
    return (
      <DashboardLayout title="Room Not Found">
        <div className="p-8 text-center text-gray-500">Room not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={room.name || 'VerbfyTalk Room'}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Room Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-600" />
                {room.name}
              </h1>
              <p className="text-gray-600 mt-2">{room.description}</p>
              
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  {room.isPrivate ? (
                    <LockClosedIcon className="w-4 h-4" />
                  ) : (
                    <GlobeAltIcon className="w-4 h-4" />
                  )}
                  <span>{room.isPrivate ? 'Private' : 'Public'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {getLevelIcon(room.level)}
                  <span>{room.level}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-4 h-4" />
                  <span>{room.participants?.filter((p: any) => p.isActive).length || 0}/{room.maxParticipants}</span>
                </div>
                
                {room.startedAt && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Started {formatDate(room.startedAt)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {!joined ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {joining ? 'Joining...' : 'Join Room'}
                </button>
              ) : (
                <button
                  onClick={handleLeave}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Leave Room
                </button>
              )}
            </div>
          </div>
          
          {room.topic && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Discussion Topic</h3>
              <p className="text-blue-800">{room.topic}</p>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Participants ({room.participants?.filter((p: any) => p.isActive).length || 0})
          </h2>
          
          {/* Audio Controls for joined users */}
          {joined && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <SpeakerWaveIcon className="w-5 h-5" />
                Voice Chat Controls
              </h3>
              
              {/* Microphone Permission Status */}
              {!localStreamRef.current ? (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm mb-2">
                    🔒 Microphone access required for voice chat
                  </p>
                  
                  {/* Show error if microphone failed */}
                  {microphoneError && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm mb-2">
                        ❌ {microphoneError.message}
                      </p>
                      {microphoneError.showRetry && (
                        <button
                          onClick={() => {
                            setMicrophoneError(null);
                            initializeAudio();
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          🔄 Try Again
                        </button>
                      )}
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      setMicrophoneError(null);
                      initializeAudio();
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    🎤 Enable Microphone
                  </button>
                  
                  {/* Additional help text */}
                  <div className="mt-2 text-xs text-yellow-700">
                    <p><strong>💡 Troubleshooting:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Make sure you're using HTTPS (https://verbfy.com)</li>
                      <li>Check browser microphone permissions in settings</li>
                      <li>Ensure no other apps are using the microphone</li>
                      <li>Try refreshing the page if permission was denied</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleMute}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isMuted 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    <MicrophoneIcon className={`w-5 h-5 ${isMuted ? 'text-red-600' : 'text-green-600'}`} />
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  
                  {/* Audio Level Indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-100 ${
                          isSpeaking ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {isSpeaking ? 'Speaking' : 'Silent'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Voice Chat Instructions */}
              <div className="mt-3 text-xs text-blue-700">
                <p>💡 <strong>Voice Chat Tips:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Click "Enable Microphone" to start voice chat</li>
                  <li>Use Mute/Unmute to control your audio</li>
                  <li>Green indicator shows when you're speaking</li>
                  <li>Ensure your microphone is working and not blocked by other apps</li>
                </ul>
              </div>
            </div>
          )}
          
          {room.participants && room.participants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {room.participants
                .filter((p: any) => p.isActive) // Only show active participants
                .filter((p: any, index: number, arr: any[]) => 
                  // Remove duplicates by userId
                  arr.findIndex(participant => participant.userId._id === p.userId._id) === index
                )
                .map((participant: any, index: number) => (
                  <div key={`${participant.userId._id}-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="relative">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {participant.userId?.name?.charAt(0) || 'U'}
                      </div>
                      {/* Speaking indicator */}
                      {participant.isSpeaking && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{participant.userId?.name || 'Unknown User'}</p>
                      <p className="text-sm text-gray-500">
                        Joined {formatDate(participant.joinedAt)}
                      </p>
                      {/* Audio status */}
                      <div className="flex items-center gap-2 mt-1">
                        <MicrophoneIcon className={`w-4 h-4 ${
                          participant.isMuted ? 'text-red-500' : 'text-green-500'
                        }`} />
                        <span className="text-xs text-gray-500">
                          {participant.isMuted ? 'Muted' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No participants yet</p>
          )}
        </div>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Room Password</h3>
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setJoinPassword('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {joining ? 'Joining...' : 'Join'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}