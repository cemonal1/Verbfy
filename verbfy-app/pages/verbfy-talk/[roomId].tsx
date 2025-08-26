import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthContext } from '@/context/AuthContext';
import io, { Socket } from 'socket.io-client';

interface Peer {
  id: string;
  name: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

export default function VerbfyTalkRoom() {
  const router = useRouter();
  const { roomId } = router.query as { roomId?: string };
  const { user } = useAuthContext();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<{ [key: string]: Peer }>({});
  const [isMicOn, setIsMicOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  // WebRTC configuration
  const webrtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' }
    ]
  };

  // Initialize audio context for Safari
  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
        
        // Resume audio context on user interaction
        const resumeAudio = () => {
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
        };
        
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
      }
    };

    initAudioContext();
  }, [audioContext]);

  // Request microphone access with user gesture
  const requestMic = async () => {
    try {
      console.log("🎤 Requesting microphone...");
      
      // Check if we're in a secure context
      if (!window.isSecureContext) {
        throw new Error('Microphone access requires HTTPS');
      }

      // Check permissions policy
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('🔍 Microphone permission status:', permission.state);
          
          if (permission.state === 'denied') {
            throw new Error('Microphone permission permanently denied');
          }
        } catch (permError) {
          console.log('⚠️ Could not check permission status, proceeding with getUserMedia');
        }
      }

      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      console.log('✅ Microphone access granted');
      setStream(localStream);
      localStreamRef.current = localStream;
      return localStream;
    } catch (err: any) {
      console.error("❌ Mic error:", err);
      
      let errorMessage = 'Microphone access denied';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Microphone access not supported in this browser.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Microphone is already in use by another application.';
      } else if (err.message.includes('secure context')) {
        errorMessage = 'Microphone access requires HTTPS. Please use https://verbfy.com instead of http.';
      } else if (err.message.includes('permanently denied')) {
        errorMessage = 'Microphone access permanently blocked. Please enable it in browser settings.';
      } else if (err.message.includes('permissions policy')) {
        errorMessage = 'Permissions policy violation. Please try the User Interaction button or check browser settings.';
      }
      
      setError(errorMessage);
      return null;
    }
  };

  // Create peer connection
  const createPeer = (userId: string, initiator: boolean, localStream: MediaStream) => {
    const peer = new RTCPeerConnection(webrtcConfig);
    
    // Add local stream
    localStream.getTracks().forEach(track => {
      peer.addTrack(track, localStream);
    });

    // Handle remote stream
    peer.ontrack = (event) => {
      console.log(`🎵 Received audio stream from ${userId}`);
      
      const remoteStream = event.streams[0];
      
      // Create audio element for remote peer with cross-platform compatibility
      const audio = document.createElement('audio');
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.volume = 0.8;
      audio.muted = false;
      
      // Cross-platform audio attributes (iOS Safari compatibility)
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.setAttribute('controls', 'false');
      audio.setAttribute('preload', 'none');
      
      // Store reference
      audioRefs.current[userId] = audio;
      
      // Add to DOM
      document.body.appendChild(audio);
      
      // Update peer state
      setPeers(prev => ({
        ...prev,
        [userId]: {
          id: userId,
          name: `User ${userId.slice(0, 4)}`,
          isMuted: false,
          isSpeaking: false
        }
      }));
    };

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('signal', {
          to: userId,
          data: {
            type: 'ice-candidate',
            candidate: event.candidate
          }
        });
      }
    };

    // Handle connection state changes
    peer.onconnectionstatechange = () => {
      console.log(`🔗 Peer connection state with ${userId}:`, peer.connectionState);
    };

    peerConnections.current[userId] = peer;
    return peer;
  };

  // Handle signaling data
  const handleSignal = async (data: any) => {
    const { from, data: signalData } = data;
    
    if (!localStreamRef.current) return;

    let peer = peerConnections.current[from];
    
    if (!peer) {
      peer = createPeer(from, false, localStreamRef.current);
    }

    if (signalData.type === 'offer') {
      await peer.setRemoteDescription(new RTCSessionDescription(signalData));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      
      socket?.emit('signal', {
        to: from,
        data: {
          type: 'answer',
          answer: answer
        }
      });
    } else if (signalData.type === 'answer') {
      await peer.setRemoteDescription(new RTCSessionDescription(signalData.answer));
    } else if (signalData.type === 'ice-candidate') {
      await peer.addIceCandidate(new RTCIceCandidate(signalData.candidate));
    }
  };

  // Initialize socket connection
  useEffect(() => {
    if (!roomId) return;

    const initSocket = () => {
      console.log('🔌 Initializing socket connection...');
      
      const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.verbfy.com', {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        setIsConnecting(false);
        setError(null);
      });

      newSocket.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err);
        setError('Failed to connect to server. Please try again.');
        setIsConnecting(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          setTimeout(() => {
            newSocket.connect();
          }, 1000);
        }
      });

      newSocket.on('userJoined', (userId) => {
        console.log(`👤 User joined: ${userId}`);
        
        if (localStreamRef.current) {
          const peer = createPeer(userId, true, localStreamRef.current);
          
          // Create offer
          peer.createOffer().then(offer => {
            peer.setLocalDescription(offer);
            newSocket.emit('signal', {
              to: userId,
              data: {
                type: 'offer',
                offer: offer
              }
            });
          });
        }
      });

      newSocket.on('userLeft', (userId) => {
        console.log(`👤 User left: ${userId}`);
        
        // Close peer connection
        if (peerConnections.current[userId]) {
          peerConnections.current[userId].close();
          delete peerConnections.current[userId];
        }
        
        // Remove audio element
        if (audioRefs.current[userId]) {
          document.body.removeChild(audioRefs.current[userId]);
          delete audioRefs.current[userId];
        }
        
        // Update peers state
        setPeers(prev => {
          const newPeers = { ...prev };
          delete newPeers[userId];
          return newPeers;
        });
      });

      newSocket.on('signal', handleSignal);

      newSocket.on('roomFull', () => {
        setError('Room is full (max 5 users)');
      });

      setSocket(newSocket);

      return newSocket;
    };

    const newSocket = initSocket();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      
      // Cleanup peer connections
      Object.values(peerConnections.current).forEach(peer => peer.close());
      peerConnections.current = {};
      
      // Cleanup audio elements
      Object.values(audioRefs.current).forEach(audio => {
        if (audio.parentNode) {
          audio.parentNode.removeChild(audio);
        }
      });
      audioRefs.current = {};
      
      // Cleanup local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [roomId]);

  // Join room function
  const joinRoom = async () => {
    if (!socket || !roomId) return;

    try {
      const localStream = await requestMic();
      if (localStream) {
        socket.emit('joinRoom', roomId);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Failed to join room. Please try again.');
    }
  };

  // Leave room function
  const leaveRoom = () => {
    if (socket) {
      socket.emit('leaveRoom', roomId);
    }
    
    // Cleanup
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    setStream(null);
    setPeers({});
    router.push('/verbfy-talk');
  };

  // Toggle microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  if (!roomId) {
    return (
      <DashboardLayout title="VerbfyTalk">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Room Not Found</h1>
            <p className="text-gray-600 mb-6">The room you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/verbfy-talk')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Rooms
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>VerbfyTalk Room - {roomId}</title>
        <meta name="description" content="Join the conversation in VerbfyTalk" />
      </Head>
      
      <DashboardLayout title={`VerbfyTalk Room: ${roomId}`}>
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  🎤 VerbfyTalk Room
                </h1>
                <p className="text-gray-600 mt-1">Room ID: {roomId}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Maximum 5 participants • Audio only • P2P connection
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {!stream ? (
                  <button
                    onClick={joinRoom}
                    disabled={isConnecting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isConnecting ? 'Connecting...' : '🎧 Join Room'}
                  </button>
                ) : (
                  <button
                    onClick={leaveRoom}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Leave Room
                  </button>
                )}
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
                onClick={() => setError(null)}
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
                <div className={`w-3 h-3 rounded-full ${socket?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-700">
                  WebSocket: {socket?.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stream ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-700">
                  Microphone: {stream ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${audioContext ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-700">
                  Audio Context: {audioContext ? 'Ready' : 'Not Ready'}
                </span>
              </div>
            </div>
          </div>

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
                    Click the button below to join the audio conversation. You'll need to allow microphone access.
                  </p>
                  <button
                    onClick={joinRoom}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    🎧 Join Room
                  </button>
                </div>
              </div>
            )}

            {/* Participants Grid */}
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

                {/* Remote Users */}
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
                    <p className="text-sm text-gray-600">Remote</p>
                    {peer.isMuted && (
                      <div className="mt-2 text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                        Muted
                      </div>
                    )}
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
                    <span className="font-medium">Participants:</span> {Object.keys(peers).length + (stream ? 1 : 0)}/5
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
          {stream && (
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
                  onClick={leaveRoom}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200"
                >
                  🚪 Leave Room
                </button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
