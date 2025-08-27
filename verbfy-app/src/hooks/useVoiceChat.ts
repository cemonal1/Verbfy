import { useState, useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface User {
  id: string;
  name: string;
  socketId: string;
}

interface VoiceChatState {
  isConnected: boolean;
  isConnecting: boolean;
  currentRoom: string | null;
  users: User[];
  localStream: MediaStream | null;
  isMicOn: boolean;
  error: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

interface VoiceChatActions {
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  toggleMic: () => void;
  requestMicrophone: () => Promise<boolean>;
  clearError: () => void;
}

export function useVoiceChat(): VoiceChatState & VoiceChatActions {
  const [state, setState] = useState<VoiceChatState>({
    isConnected: false,
    isConnecting: false,
    currentRoom: null,
    users: [],
    localStream: null,
    isMicOn: true,
    error: null,
    connectionStatus: 'disconnected'
  });

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioRefsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;

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
  const initAudioContext = useCallback(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context on user interaction
      const resumeAudio = () => {
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
      };
      
      document.addEventListener('click', resumeAudio, { once: true });
      document.addEventListener('touchstart', resumeAudio, { once: true });
    }
  }, []);

  // Request microphone access
  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🎤 Requesting microphone access...');
      
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

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      console.log('✅ Microphone access granted');
      localStreamRef.current = stream;
      
      setState(prev => ({
        ...prev,
        localStream: stream,
        isMicOn: true,
        error: null
      }));

      return true;
    } catch (err: any) {
      console.error("❌ Microphone error:", err);
      
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
        errorMessage = 'Permissions policy violation. Please try refreshing the page or check browser settings.';
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        localStream: null,
        isMicOn: false
      }));

      return false;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((socketId: string, isInitiator: boolean): RTCPeerConnection => {
    const peer = new RTCPeerConnection(webrtcConfig);
    
    // Add local stream if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peer.ontrack = (event) => {
      console.log(`🎵 Received audio stream from ${socketId}`);
      
      const remoteStream = event.streams[0];
      
      // Create audio element for remote peer
      const audio = document.createElement('audio');
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.volume = 0.8;
      audio.muted = false;
      
      // Cross-platform audio attributes
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.setAttribute('controls', 'false');
      audio.setAttribute('preload', 'none');
      
      // Store reference
      audioRefsRef.current.set(socketId, audio);
      
      // Add to DOM
      document.body.appendChild(audio);
    };

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal', {
          to: socketId,
          data: {
            type: 'ice-candidate',
            candidate: event.candidate
          }
        });
      }
    };

    // Handle connection state changes
    peer.onconnectionstatechange = () => {
      console.log(`🔗 Peer connection state with ${socketId}:`, peer.connectionState);
    };

    peerConnectionsRef.current.set(socketId, peer);
    return peer;
  }, []);

  // Handle signaling data
  const handleSignal = useCallback(async (data: any) => {
    const { from, data: signalData } = data;
    
    if (!localStreamRef.current) return;

    let peer = peerConnectionsRef.current.get(from);
    
    if (!peer) {
      peer = createPeerConnection(from, false);
    }

    try {
      if (signalData.type === 'offer') {
        await peer.setRemoteDescription(new RTCSessionDescription(signalData));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        
        socketRef.current?.emit('signal', {
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
    } catch (error) {
      console.error('❌ Error handling signal:', error);
    }
  }, [createPeerConnection]);

  // Connect to server
  const connect = useCallback(async (token: string): Promise<void> => {
    if (socketRef.current?.connected) {
      console.log('🔌 Already connected');
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, connectionStatus: 'connecting' }));

    try {
      const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.verbfy.com', {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        forceNew: true,
        withCredentials: true,
        auth: {
          token
        }
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectionStatus: 'connected',
          error: null
        }));
        reconnectAttemptsRef.current = 0;
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err);
        setState(prev => ({
          ...prev,
          isConnecting: false,
          connectionStatus: 'error',
          error: 'Failed to connect to server. Please try again.'
        }));
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
          connectionStatus: 'disconnected'
        }));

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Attempting reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
          setTimeout(() => {
            socket.connect();
          }, 2000 * reconnectAttemptsRef.current);
        }
      });

      socket.on('authenticated', (data) => {
        console.log('✅ User authenticated:', data);
      });

      socket.on('authentication_error', (data) => {
        console.error('❌ Authentication error:', data);
        setState(prev => ({
          ...prev,
          error: 'Authentication failed. Please try again.',
          isConnecting: false,
          connectionStatus: 'error'
        }));
      });

      socket.on('roomJoined', (data) => {
        console.log('🏠 Joined room:', data);
        setState(prev => ({
          ...prev,
          currentRoom: data.roomId,
          users: data.users
        }));
      });

      socket.on('userJoined', (data) => {
        console.log('👤 User joined:', data);
        setState(prev => ({
          ...prev,
          users: [...prev.users, { id: data.userId, name: data.userName, socketId: data.socketId }]
        }));

        // Create peer connection for new user
        if (localStreamRef.current) {
          const peer = createPeerConnection(data.socketId, true);
          
          // Create offer
          peer.createOffer().then(offer => {
            peer.setLocalDescription(offer);
            socket.emit('signal', {
              to: data.socketId,
              data: {
                type: 'offer',
                offer: offer
              }
            });
          }).catch(error => {
            console.error('❌ Error creating offer:', error);
          });
        }
      });

      socket.on('userLeft', (data) => {
        console.log('👋 User left:', data);
        setState(prev => ({
          ...prev,
          users: prev.users.filter(user => user.socketId !== data.socketId)
        }));

        // Close peer connection
        const peer = peerConnectionsRef.current.get(data.socketId);
        if (peer) {
          peer.close();
          peerConnectionsRef.current.delete(data.socketId);
        }

        // Remove audio element
        const audio = audioRefsRef.current.get(data.socketId);
        if (audio && audio.parentNode) {
          audio.parentNode.removeChild(audio);
          audioRefsRef.current.delete(data.socketId);
        }
      });

      socket.on('signal', handleSignal);

      socket.on('roomFull', (data) => {
        console.log('❌ Room is full:', data);
        setState(prev => ({
          ...prev,
          error: data.message
        }));
      });

      socket.on('error', (data) => {
        console.error('❌ Server error:', data);
        setState(prev => ({
          ...prev,
          error: data.message
        }));
      });

      socketRef.current = socket;

      // Authenticate
      socket.emit('authenticate', { token });

    } catch (error) {
      console.error('❌ Connection failed:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectionStatus: 'error',
        error: 'Failed to connect to server'
      }));
    }
  }, [handleSignal, createPeerConnection]);

  // Disconnect from server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Cleanup peer connections
    peerConnectionsRef.current.forEach(peer => peer.close());
    peerConnectionsRef.current.clear();

    // Cleanup audio elements
    audioRefsRef.current.forEach(audio => {
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
    });
    audioRefsRef.current.clear();

    // Cleanup local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      currentRoom: null,
      users: [],
      localStream: null,
      isMicOn: false,
      connectionStatus: 'disconnected'
    }));
  }, []);

  // Join room
  const joinRoom = useCallback(async (roomId: string): Promise<void> => {
    if (!socketRef.current?.connected) {
      setState(prev => ({ ...prev, error: 'Not connected to server' }));
      return;
    }

    try {
      // Request microphone access first
      const micGranted = await requestMicrophone();
      if (!micGranted) {
        setState(prev => ({ ...prev, error: 'Microphone access required to join room' }));
        return;
      }

      socketRef.current.emit('joinRoom', { roomId });
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      setState(prev => ({ ...prev, error: 'Failed to join room' }));
    }
  }, [requestMicrophone]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (socketRef.current && state.currentRoom) {
      socketRef.current.emit('leaveRoom');
    }

    // Cleanup peer connections
    peerConnectionsRef.current.forEach(peer => peer.close());
    peerConnectionsRef.current.clear();

    // Cleanup audio elements
    audioRefsRef.current.forEach(audio => {
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
    });
    audioRefsRef.current.clear();

    setState(prev => ({
      ...prev,
      currentRoom: null,
      users: []
    }));
  }, [state.currentRoom]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(prev => ({
          ...prev,
          isMicOn: audioTrack.enabled
        }));
      }
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize audio context on mount
  useEffect(() => {
    initAudioContext();
  }, [initAudioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    toggleMic,
    requestMicrophone,
    clearError
  };
}
