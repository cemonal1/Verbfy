import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthContext } from '@/context/AuthContext';
import io, { Socket } from 'socket.io-client';

interface Peer {
  id: string;
  name: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

interface VerbfyTalkRoomProps {
  roomId: string;
}

export default function VerbfyTalkRoom({ roomId }: VerbfyTalkRoomProps) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<{ [key: string]: Peer }>({});
  const [isMicOn, setIsMicOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomUsers, setRoomUsers] = useState<Peer[]>([]);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<{ [key: string]: any }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  // AudioContext for Safari iOS compatibility
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on user gesture (required for iOS Safari)
  useEffect(() => {
    const unlockAudioContext = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
        console.log('🔊 AudioContext resumed');
      }
    };

    // Create AudioContext on first user interaction
    const handleUserGesture = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('🔊 AudioContext created');
      }
      unlockAudioContext();
      
      // Remove event listeners after first interaction
      document.removeEventListener('click', handleUserGesture);
      document.removeEventListener('touchstart', handleUserGesture);
    };

    // Listen for user gestures (required for iOS Safari)
    document.addEventListener('click', handleUserGesture);
    document.addEventListener('touchstart', handleUserGesture);

    return () => {
      document.removeEventListener('click', handleUserGesture);
      document.removeEventListener('touchstart', handleUserGesture);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Request microphone access with cross-platform compatibility
  const requestMic = async (): Promise<MediaStream | null> => {
    try {
      console.log('🎤 Requesting microphone access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Cross-platform audio constraints
      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        // Mobile-specific optimizations
        ...(navigator.userAgent.includes('Mobile') && {
          channelCount: 1,
          latency: 0.01
        })
      };

      console.log('🎤 Audio constraints:', audioConstraints);

      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false // Camera is completely disabled
      });

      console.log('✅ Microphone access granted:', {
        audioTracks: localStream.getAudioTracks().length,
        audioTrack: localStream.getAudioTracks()[0]?.label,
        device: localStream.getAudioTracks()[0]?.getSettings()
      });

      // Verify audio tracks exist
      if (localStream.getAudioTracks().length === 0) {
        throw new Error('No audio tracks found in stream');
      }

      setStream(localStream);
      return localStream;

    } catch (err) {
      console.error('❌ Failed to get microphone access:', err);
      
      let errorMessage = 'Failed to access microphone';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone permissions in your browser.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Microphone is already in use by another application.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      return null;
    }
  };

  // Initialize room connection (called after microphone access)
  const initializeRoomConnection = async (localStream: MediaStream) => {
    try {
      console.log('🔗 Initializing room connection...');
      setIsConnecting(true);
      setError(null);

      // Connect to signaling server
      const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
        path: '/socket.io',
        auth: {
          token: localStorage.getItem('token')
        },
        // Mobile-optimized Socket.IO settings
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true
      });

      socketRef.current = socket;

      // Join room
      socket.emit('joinVerbfyTalkRoom', { roomId });

      // Handle room events
      socket.on('roomJoined', (data) => {
        console.log('✅ Joined room:', data);
        setRoomUsers(data.users || []);
        setIsConnecting(false);
      });

      socket.on('userJoined', (data) => {
        console.log('👋 User joined:', data);
        const newPeer = createPeer(data.userId, data.userName, localStream, true);
        peersRef.current[data.userId] = newPeer;
        
        setPeers(prev => ({
          ...prev,
          [data.userId]: {
            id: data.userId,
            name: data.userName,
            isMuted: false,
            isSpeaking: false
          }
        }));
      });

      socket.on('userLeft', (userId) => {
        console.log('👋 User left:', userId);
        if (peersRef.current[userId]) {
          peersRef.current[userId].destroy();
          delete peersRef.current[userId];
        }
        
        setPeers(prev => {
          const newPeers = { ...prev };
          delete newPeers[userId];
          return newPeers;
        });
      });

      socket.on('signal', async (data) => {
        console.log('📡 Received signal from:', data.from);
        let peer = peersRef.current[data.from];
        
        if (!peer) {
          // Create new peer connection
          peer = createPeer(data.from, data.userName || 'Unknown', localStream, false);
          peersRef.current[data.from] = peer;
          
          setPeers(prev => ({
            ...prev,
            [data.from]: {
              id: data.from,
              name: data.userName || 'Unknown',
              isMuted: false,
              isSpeaking: false
            }
          }));
        }
        
        // Handle the signal
        peer.signal(data.signal);
      });

      socket.on('roomFull', (data) => {
        console.log('❌ Room is full');
        setError('Room is full (maximum 5 users)');
        setIsConnecting(false);
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err);
        setError(`Connection failed: ${err.message}`);
        setIsConnecting(false);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          socket.connect();
        }
      });

    } catch (err) {
      console.error('❌ Failed to initialize room connection:', err);
      setError(`Failed to connect to room: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsConnecting(false);
    }
  };

  // Handle join room button click (user gesture required for iOS Safari)
  const handleJoinRoom = async () => {
    try {
      const localStream = await requestMic();
      if (localStream) {
        await initializeRoomConnection(localStream);
      }
    } catch (error) {
      console.error('❌ Failed to join room:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      Object.values(peersRef.current).forEach(peer => {
        if (peer && typeof peer.destroy === 'function') {
          peer.destroy();
        }
      });
    };
  }, [stream]);

  // Create peer connection
  const createPeer = (userId: string, userName: string, localStream: MediaStream, isInitiator: boolean) => {
    console.log(`🔗 Creating peer connection for ${userName} (${userId})`);
    
    // Use simple-peer for P2P audio
    const SimplePeer = require('simple-peer');
    const peer = new SimplePeer({
      initiator: isInitiator,
      trickle: false,
      stream: localStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    });

    // Handle peer signals
    peer.on('signal', (signal: any) => {
      console.log(`📡 Sending signal to ${userName}`);
      if (socketRef.current) {
        socketRef.current.emit('signal', {
          to: userId,
          signal,
          userName: user?.name || 'Unknown'
        });
      }
    });

    // Handle remote stream
    peer.on('stream', (remoteStream: MediaStream) => {
      console.log(`🎵 Received audio stream from ${userName}`);
      
      // Create audio element for remote peer with cross-platform compatibility
      const audio = document.createElement('audio');
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.playsInline = true; // Required for iOS Safari
      audio.volume = 0.8;
      audio.muted = false;
      
      // Cross-platform audio attributes
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      
      // Store reference
      audioRefs.current[userId] = audio;
      
      // Add to DOM
      document.body.appendChild(audio);
      
      // iOS Safari audio unlock workaround
      const unlockAudio = () => {
        audio.play().catch(err => {
          console.log('🔊 Audio autoplay failed, will retry on user interaction:', err);
        });
      };
      
      // Try to unlock audio immediately
      unlockAudio();
      
      // Also try on user interaction
      const handleInteraction = () => {
        unlockAudio();
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      };
      
      document.addEventListener('click', handleInteraction);
      document.addEventListener('touchstart', handleInteraction);
    });

    // Handle peer connection state
    peer.on('connect', () => {
      console.log(`✅ Connected to ${userName}`);
    });

    peer.on('close', () => {
      console.log(`❌ Connection closed with ${userName}`);
      if (audioRefs.current[userId]) {
        audioRefs.current[userId].remove();
        delete audioRefs.current[userId];
      }
    });

    peer.on('error', (err: Error) => {
      console.error(`❌ Peer error with ${userName}:`, err);
    });

    return peer;
  };

  // Toggle microphone
  const toggleMic = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicOn(!isMicOn);
      console.log(`🎤 Microphone ${!isMicOn ? 'enabled' : 'disabled'}`);
    }
  };

  // Leave room
  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leaveVerbfyTalkRoom', { roomId });
    }
    router.push('/talk');
  };

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Connecting to VerbfyTalk...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-gray-900 text-xl font-semibold mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/talk')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>VerbfyTalk - {roomId}</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">VerbfyTalk: {roomId}</h1>
                <p className="text-sm text-gray-600">
                  {Object.keys(peers).length + 1} participant{(Object.keys(peers).length + 1) !== 1 ? 's' : ''} • Audio Only
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full transition-colors ${
                  isMicOn 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={leaveRoom}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition-colors text-white"
              >
                Leave Room
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Join Room Button (if not connected) */}
          {!stream && !isConnecting && (
            <div className="text-center mb-8">
              <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎤</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Join VerbfyTalk Room
                </h3>
                <p className="text-gray-600 mb-6">
                  Click the button below to join the audio conversation. 
                  You'll be asked to allow microphone access.
                </p>
                <button
                  onClick={handleJoinRoom}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
                >
                  🎧 Join Room
                </button>
                <p className="text-xs text-gray-500 mt-4">
                  💡 Tip: Make sure to allow microphone permissions when prompted
                </p>
              </div>
            </div>
          )}

          {/* Participants Grid (only show when connected) */}
          {stream && (
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

            {/* Remote Participants */}
            {Object.values(peers).map((peer) => (
              <div key={peer.id} className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {peer.name} {peer.isMuted ? '🔇' : '🎤'}
                </h3>
                <p className="text-sm text-gray-600">Connected</p>
                {peer.isSpeaking && (
                  <div className="mt-2 text-xs text-green-500 bg-green-50 px-2 py-1 rounded">
                    Speaking
                  </div>
                )}
              </div>
            ))}
          </div>
          )}

          {/* Room Info */}
          <div className="mt-8 text-center">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-2">Room Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Audio-only conversation</p>
                <p>• Maximum 5 participants</p>
                <p>• Peer-to-peer connection</p>
                <p>• No video recording</p>
              </div>
            </div>
          </div>
        </div>

        {/* Local Audio Element (hidden) */}
        <audio
          ref={localAudioRef}
          autoPlay
          muted
          playsInline
          style={{ display: 'none' }}
        />
      </div>
    </>
  );
}

// Get room ID from query params
VerbfyTalkRoom.getInitialProps = async ({ query }: any) => {
  return { roomId: query.roomId };
};
