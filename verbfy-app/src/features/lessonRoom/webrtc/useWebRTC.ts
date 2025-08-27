import { useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface PeerIds {
  self: string;
  remote?: string;
}

interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export function useWebRTC(roomId: string, peerIds: PeerIds, participantPeerIds: string[]) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [peerId: string]: MediaStream }>({});
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [status, setStatus] = useState('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [muteStates, setMuteStates] = useState<{ [peerId: string]: boolean }>({});
  const [videoStates, setVideoStates] = useState<{ [peerId: string]: boolean }>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for WebRTC connections
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<{ [peerId: string]: RTCPeerConnection }>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  // WebRTC Configuration with STUN/TURN servers
  const webrtcConfig: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // Add TURN server if available
      // { urls: 'turn:turn.verbfy.com:3478', username: 'xxx', credential: 'yyy' }
    ]
  };

  // Initialize media stream with proper getUserMedia call
  const initializeMediaStream = useCallback(async () => {
    try {
      console.log('🎤 Requesting microphone and camera access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Request both audio and video
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });

      console.log('✅ Media stream obtained:', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
        audioTrack: stream.getAudioTracks()[0]?.label,
        videoTrack: stream.getVideoTracks()[0]?.label
      });

      // Verify audio tracks exist
      if (stream.getAudioTracks().length === 0) {
        throw new Error('No audio tracks found in stream');
      }

      setLocalStream(stream);
      localStreamRef.current = stream;
      setError(null);
      
      return stream;
    } catch (err) {
      console.error('❌ Failed to get media stream:', err);
      setError(`Media access failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    console.log(`🔗 Creating peer connection for ${peerId}`);
    
    const peerConnection = new RTCPeerConnection(webrtcConfig);
    
    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
        console.log(`📡 Added ${track.kind} track to peer connection`);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log(`📺 Received remote stream from ${peerId}:`, event.streams[0]);
      setRemoteStreams(prev => ({
        ...prev,
        [peerId]: event.streams[0]
      }));
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log(`🧊 Sending ICE candidate to ${peerId}`);
        socketRef.current.emit('ice-candidate', {
          roomId,
          candidate: event.candidate,
          targetUserId: peerId
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`🔌 Connection state for ${peerId}:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setStatus('connected');
      } else if (peerConnection.connectionState === 'disconnected') {
        setStatus('disconnected');
      }
    };

    peerConnectionsRef.current[peerId] = peerConnection;
    return peerConnection;
  }, [roomId]);

  // Initialize WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      if (isInitialized) return;
      
      console.log('🚀 Initializing WebRTC...');
      setStatus('connecting');
      setError(null);

      // Initialize media stream
      await initializeMediaStream();

      // Initialize socket connection
      const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      socketRef.current = socket;

      // Join room
      socket.emit('join-room', { reservationId: roomId });

      // Handle room info
      socket.on('room-info', (data) => {
        console.log('📋 Room info received:', data);
        setStatus('connected');
      });

      // Handle offers
      socket.on('offer', async (data) => {
        console.log('📞 Received offer from:', data.userId);
        const peerConnection = createPeerConnection(data.userId);
        
        await peerConnection.setRemoteDescription(data.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('answer', {
          roomId,
          answer,
          targetUserId: data.userId
        });
      });

      // Handle answers
      socket.on('answer', async (data) => {
        console.log('📞 Received answer from:', data.userId);
        const peerConnection = peerConnectionsRef.current[data.userId];
        if (peerConnection) {
          await peerConnection.setRemoteDescription(data.answer);
        }
      });

      // Handle ICE candidates
      socket.on('ice-candidate', async (data) => {
        console.log('🧊 Received ICE candidate from:', data.userId);
        const peerConnection = peerConnectionsRef.current[data.userId];
        if (peerConnection) {
          await peerConnection.addIceCandidate(data.candidate);
        }
      });

      setIsInitialized(true);
      console.log('✅ WebRTC initialized successfully');
      
    } catch (err) {
      console.error('❌ Failed to initialize WebRTC:', err);
      setError(`WebRTC initialization failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('error');
    }
  }, [roomId, isInitialized, initializeMediaStream, createPeerConnection]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
    setIsMicOn(!isMicOn);
      console.log(`🎤 Microphone ${!isMicOn ? 'enabled' : 'disabled'}`);
    }
  }, [isMicOn]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
    setIsCameraOn(!isCameraOn);
      console.log(`📹 Camera ${!isCameraOn ? 'enabled' : 'disabled'}`);
    }
  }, [isCameraOn]);

  // Reconnect
  const reconnect = useCallback(() => {
    console.log('🔄 Reconnecting to room:', roomId);
    setIsInitialized(false);
    setStatus('disconnected');
    setError(null);
    
    // Clean up existing connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Reinitialize
    setTimeout(() => {
      initializeWebRTC();
    }, 1000);
  }, [roomId, initializeWebRTC]);

  // Toggle remote mute
  const toggleRemoteMute = useCallback((peerId: string) => {
    setMuteStates(prev => ({ ...prev, [peerId]: !prev[peerId] }));
  }, []);

  // Toggle remote video
  const toggleRemoteVideo = useCallback((peerId: string) => {
    setVideoStates(prev => ({ ...prev, [peerId]: !prev[peerId] }));
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (roomId && peerIds.self) {
      initializeWebRTC();
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, peerIds.self, initializeWebRTC]);

  return {
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
  };
} 