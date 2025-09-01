import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface VerbfyTalkRoom {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  description?: string;
  topic?: string;
  level?: string;
  isPrivate?: boolean;
  maxParticipants: number;
  participants?: any[];
  isActive: boolean;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface VerbfyTalkParticipant {
  id: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isSpeaker: boolean;
}

interface VerbfyTalkMessage {
  id: string;
  content: string;
  sender: string;
  senderName: string;
  timestamp: number;
}

interface UseVerbfyTalkReturn {
  // Room management
  rooms: VerbfyTalkRoom[];
  currentRoom: VerbfyTalkRoom | null;
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: () => void;
  createRoom: (name: string) => Promise<string | null>;
  
  // Audio controls
  isMuted: boolean;
  isSpeaker: boolean;
  isConnected: boolean;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  requestMicrophone: () => Promise<boolean>;
  
  // Media streams
  localStream: MediaStream | null;
  remoteStreams: { [peerId: string]: MediaStream };
  
  // Participants and messages
  participants: VerbfyTalkParticipant[];
  messages: VerbfyTalkMessage[];
  sendMessage: (content: string) => void;
  
  // Connection status
  isConnecting: boolean;
  connectionError: string | null;
  reconnectionAttempts: number;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  isInitialized: boolean;
  
  // Socket instance
  socket: Socket | null;
  
  // Cleanup
  disconnect: () => void;
}

// WebRTC Configuration
const WEBRTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

// Microphone error types
const MICROPHONE_ERRORS = {
  NotAllowedError: 'Microphone permission denied. Please allow microphone access in your browser settings.',
  NotFoundError: 'No microphone found. Please connect a microphone and try again.',
  NotSupportedError: 'Microphone not supported in this browser.',
  NotReadableError: 'Microphone is already in use by another application.',
  AbortError: 'Microphone access was aborted.',
  SecurityError: 'Microphone access blocked due to security restrictions.',
  InvalidStateError: 'Microphone is in an invalid state.',
  UnknownError: 'Unknown microphone error occurred.'
} as const;

export const useVerbfyTalk = (token: string): UseVerbfyTalkReturn => {
  const [rooms, setRooms] = useState<VerbfyTalkRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<VerbfyTalkRoom | null>(null);
  const [participants, setParticipants] = useState<VerbfyTalkParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const [remoteStreams, setRemoteStreams] = useState<{ [peerId: string]: MediaStream }>({});
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [messages, setMessages] = useState<VerbfyTalkMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Refs
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const iceCandidateBufferRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Voice Activity Detection
  const startVAD = useCallback(() => {
    if (!localStreamRef.current || vadIntervalRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;

    // Simple VAD using audio levels
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(localStreamRef.current);
    const analyser = audioContext.createAnalyser();
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);
    analyser.fftSize = 256;

    vadIntervalRef.current = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const isSpeaking = average > 30; // Threshold for voice activity

             // Update local speaking state
       if (socketRef.current?.connected && currentRoom) {
         socketRef.current.emit('participant:speaking', {
           roomId: currentRoom._id,
           isSpeaking
         });
       }
    }, 100);

    // Cleanup function
    return () => {
      if (vadIntervalRef.current) {
        clearInterval(vadIntervalRef.current);
        vadIntervalRef.current = null;
      }
      source.disconnect();
      analyser.disconnect();
      audioContext.close();
    };
  }, [currentRoom]);

  // Stop VAD
  const stopVAD = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
  }, []);

  // Initialize Socket.IO connection
  const initializeSocket = useCallback(async () => {
    if (!token || isInitializedRef.current || socketRef.current?.connected) return;
    
    try {
      setIsConnecting(true);
      setStatus('connecting');
      setConnectionError(null);
      setReconnectionAttempts(0);
      
      // Cleanup existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.verbfy.com'}/verbfy-talk`, {
        path: '/socket.io',
        transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
        forceNew: true, // Force new connection for VerbfyTalk
        withCredentials: true,
        auth: { token },
        timeout: 20000,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        upgrade: true,
        rememberUpgrade: true
      });
      
                   socket.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
        setStatus('connected');
        setConnectionError(null);
        setReconnectionAttempts(0);
        isInitializedRef.current = true;
      });
      
                   socket.on('disconnect', (reason) => {
        setIsConnected(false);
        setStatus('disconnected');
        setCurrentRoom(null);
        setParticipants([]);
        setCurrentUserId(null);
        stopVAD();
        
        // Cleanup peer connections on disconnect
        peerConnectionsRef.current.forEach(connection => connection.close());
        peerConnectionsRef.current.clear();
        iceCandidateBufferRef.current.clear();
      });
      
                   socket.on('connect_error', (error) => {
        setStatus('error');
        setConnectionError(`Connection failed: ${error.message}`);
        setIsConnecting(false);
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        setStatus('connecting');
        setReconnectionAttempts(attemptNumber);
        setConnectionError(`Reconnecting... (Attempt ${attemptNumber}/5)`);
      });

      socket.on('reconnect', (attemptNumber) => {
        setStatus('connected');
        setConnectionError(null);
        setReconnectionAttempts(0);
      });

      socket.on('reconnect_failed', () => {
        setStatus('error');
        setConnectionError('Failed to reconnect. Please refresh the page.');
        setIsConnecting(false);
      });

      // Room error handling
      socket.on('room:error', (data: { message: string }) => {
        setConnectionError(data.message);
        setStatus('error');
      });
      
      // Room events
      socket.on('rooms:list', (roomsList: VerbfyTalkRoom[]) => {
        setRooms(roomsList);
      });
      
      socket.on('room:joined', (room: VerbfyTalkRoom) => {
        setCurrentRoom(room);
        // Set current user ID from the room's participants
        if (room.participants && room.participants.length > 0) {
          const currentParticipant = room.participants.find((p: any) => 
            p.userId && p.userId._id && p.isActive
          );
          if (currentParticipant) {
            setCurrentUserId(currentParticipant.userId._id.toString());
          }
        }
      });
      
      socket.on('room:left', () => {
        setCurrentRoom(null);
        setParticipants([]);
        setCurrentUserId(null);
        stopVAD();
      });
      
      // Participant events with proper state management
      socket.on('participants:update', (participantsList: VerbfyTalkParticipant[]) => {
        setParticipants(participantsList);
      });
      
      socket.on('participant:joined', (participant: VerbfyTalkParticipant) => {
        setParticipants(prev => [...prev, participant]);
        
        // Create WebRTC connection with new participant
        if (localStreamRef.current && participant.id !== currentUserId) {
          setTimeout(() => {
            createPeerConnection(participant.id);
          }, 500);
        }
      });
      
      socket.on('participant:left', (participantId: string) => {
        setParticipants(prev => prev.filter(p => p.id !== participantId));
        
        // Cleanup peer connection for this participant
        const peerConnection = peerConnectionsRef.current.get(participantId);
        if (peerConnection) {
          peerConnection.close();
          peerConnectionsRef.current.delete(participantId);
        }
        
        // Clear ICE candidate buffer for this participant
        iceCandidateBufferRef.current.delete(participantId);
        
        // Remove remote stream for this participant
        setRemoteStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[participantId];
          return newStreams;
        });
      });

      socket.on('participant:mute', (data: { participantId: string; isMuted: boolean }) => {
        setParticipants(prev => 
          prev.map(p => 
            p.id === data.participantId 
              ? { ...p, isMuted: data.isMuted }
              : p
          )
        );
      });

      socket.on('participant:speaking', (data: { participantId: string; isSpeaking: boolean }) => {
        setParticipants(prev => 
          prev.map(p => 
            p.id === data.participantId 
              ? { ...p, isSpeaking: data.isSpeaking }
              : p
          )
        );
      });
      
      // WebRTC signaling with error handling
      socket.on('webrtc:offer', async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
        try {
          await handleWebRTCOffer(data.from, data.offer);
        } catch (error) {
          console.error('❌ WebRTC offer handling failed:', error);
          setConnectionError('Failed to establish voice connection');
        }
      });
      
      socket.on('webrtc:answer', async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
        try {
          await handleWebRTCAnswer(data.from, data.answer);
        } catch (error) {
          console.error('❌ WebRTC answer handling failed:', error);
          setConnectionError('Failed to complete voice connection');
        }
      });
      
      socket.on('webrtc:ice-candidate', async (data: { from: string; candidate: RTCIceCandidateInit }) => {
        try {
          await handleICECandidate(data.from, data.candidate);
        } catch (error) {
          console.error('❌ ICE candidate handling failed:', error);
          // Buffer the candidate for later if connection not ready
          const buffer = iceCandidateBufferRef.current.get(data.from) || [];
          buffer.push(data.candidate);
          iceCandidateBufferRef.current.set(data.from, buffer);
        }
      });
      
      socketRef.current = socket;
      
      // Request rooms list
      socket.emit('rooms:get');
      
    } catch (error) {
      console.error('❌ Failed to initialize VerbfyTalk:', error);
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
      setIsConnecting(false);
    }
  }, [token, stopVAD]);
  
  // WebRTC handlers with improved error handling
  const handleWebRTCOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);
      
      peerConnectionsRef.current.set(from, peerConnection);
      
      // Add local stream if available
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current!);
        });
      }
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current?.connected && currentRoom) {
          socketRef.current.emit('webrtc:ice-candidate', {
            roomId: currentRoom._id,
            to: from,
            candidate: event.candidate
          });
        }
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'failed') {
          peerConnection.close();
          peerConnectionsRef.current.delete(from);
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        // ICE connection state changed
      };

      // Handle incoming remote streams
      peerConnection.ontrack = (event) => {
        setRemoteStreams(prev => ({
          ...prev,
          [from]: event.streams[0]
        }));
      };
      
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socketRef.current?.emit('webrtc:answer', { 
        roomId: currentRoom?._id,
        to: from, 
        answer 
      });
      
      // Process buffered ICE candidates
      const bufferedCandidates = iceCandidateBufferRef.current.get(from) || [];
      for (const candidate of bufferedCandidates) {
        try {
          await peerConnection.addIceCandidate(candidate);
        } catch (error) {
          console.warn('Failed to add buffered ICE candidate:', error);
        }
      }
      iceCandidateBufferRef.current.delete(from);
      
    } catch (error) {
      console.error('❌ WebRTC offer handling failed:', error);
      throw error;
    }
  };
  
  const handleWebRTCAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection && peerConnection.signalingState !== 'closed') {
        await peerConnection.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error('❌ WebRTC answer handling failed:', error);
      throw error;
    }
  };
  
  const handleICECandidate = async (from: string, candidate: RTCIceCandidateInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection && peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(candidate);
      } else {
        // Buffer candidate if connection not ready
        const buffer = iceCandidateBufferRef.current.get(from) || [];
        buffer.push(candidate);
        iceCandidateBufferRef.current.set(from, buffer);
      }
    } catch (error) {
      console.error('❌ ICE candidate handling failed:', error);
      throw error;
    }
  };
  
  // Room management
  const joinRoom = useCallback(async (roomId: string): Promise<boolean> => {
    if (!socketRef.current?.connected) {
      setConnectionError('Not connected to server');
      return false;
    }
    
    try {
      socketRef.current.emit('room:join', { roomId });
      
      // Initialize WebRTC connections with existing participants
      setTimeout(() => {
        if (localStreamRef.current && participants.length > 0) {
          participants.forEach(participant => {
            if (participant.id !== currentUserId) {
              createPeerConnection(participant.id);
            }
          });
        }
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      setConnectionError('Failed to join room');
      return false;
    }
  }, [participants, currentUserId]);

  // Create peer connection and send offer
  const createPeerConnection = useCallback((participantId: string) => {
    if (!localStreamRef.current || !socketRef.current?.connected || !currentRoom) return;
    
    const peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);
    peerConnectionsRef.current.set(participantId, peerConnection);
    
    // Add local stream
    localStreamRef.current.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStreamRef.current!);
    });
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.connected && currentRoom) {
        socketRef.current.emit('webrtc:ice-candidate', {
          roomId: currentRoom._id,
          to: participantId,
          candidate: event.candidate
        });
      }
    };
    
    // Handle remote streams
    peerConnection.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [participantId]: event.streams[0]
      }));
    };
    
    // Create and send offer
    peerConnection.createOffer()
      .then(offer => peerConnection.setLocalDescription(offer))
      .then(() => {
        if (socketRef.current?.connected && currentRoom) {
          socketRef.current.emit('webrtc:offer', {
            roomId: currentRoom._id,
            to: participantId,
            offer: peerConnection.localDescription
          });
        }
      })
      .catch(error => {
        console.error('Failed to create offer:', error);
      });
  }, [currentRoom]);
  
  const leaveRoom = useCallback(() => {
    if (!socketRef.current?.connected || !currentRoom) return;
    
         socketRef.current.emit('room:leave', { roomId: currentRoom._id });
    stopVAD();
  }, [currentRoom, stopVAD]);
  
  const createRoom = useCallback(async (name: string): Promise<string | null> => {
    if (!socketRef.current?.connected) {
      setConnectionError('Not connected to server');
      return null;
    }
    
    try {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(null);
        }, 10000); // 10 second timeout
        
        socketRef.current?.emit('room:create', { name }, (response: { success: boolean; roomId?: string }) => {
          clearTimeout(timeout);
          if (response.success && response.roomId) {
            resolve(response.roomId);
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('❌ Failed to create room:', error);
      setConnectionError('Failed to create room');
      return null;
    }
  }, []);
  
  // Audio controls with unified mute logic
  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Check permission status first
      let permissionStatus = 'unknown';
      try {
        if (navigator.permissions?.query) {
          const result = await navigator.permissions.query({ 
            name: 'microphone' as PermissionName 
          });
          permissionStatus = result.state;
        }
      } catch (error) {
        // Could not check permission status, proceeding with getUserMedia
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }, 
        video: false 
      });
      
      localStreamRef.current = stream;
      
      // Set up audio context for volume control
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Store references
      audioContextRef.current = audioContext;
      sourceNodeRef.current = source;
      gainNodeRef.current = gainNode;
      
      // Mute initially using gain node
      gainNode.gain.value = 0;
      setIsMuted(true);
      
      return true;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Microphone error:', error);
      
      const errorMessage = MICROPHONE_ERRORS[error.name as keyof typeof MICROPHONE_ERRORS] || 
                          MICROPHONE_ERRORS.UnknownError;
      
      setConnectionError(errorMessage);
      return false;
    }
  }, []);
  
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current || !gainNodeRef.current) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Use gain node for mute/unmute (more reliable than track.enabled)
    gainNodeRef.current.gain.value = newMutedState ? 0 : 1;
    
    // Also update track enabled state for WebRTC
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !newMutedState;
    }
    
         // Notify other participants
     socketRef.current?.emit('participant:mute', { 
       roomId: currentRoom?._id, 
       isMuted: newMutedState 
     });
  }, [isMuted, currentRoom]);
  
  const toggleSpeaker = useCallback(() => {
    const newSpeakerState = !isSpeaker;
    setIsSpeaker(newSpeakerState);
    
         // Notify other participants
     socketRef.current?.emit('participant:speaker', { 
       roomId: currentRoom?._id, 
       isSpeaker: newSpeakerState 
     });
  }, [isSpeaker, currentRoom]);
  
  const sendMessage = useCallback((content: string) => {
    if (!socketRef.current || !currentRoom) return;
    
    const message: VerbfyTalkMessage = {
      id: Date.now().toString(),
      content,
      sender: 'current-user', // This should be replaced with actual user ID
      senderName: 'You', // This should be replaced with actual user name
      timestamp: Date.now()
    };
    
    // Add message to local state
    setMessages(prev => [...prev, message]);
    
         // Send via socket
     socketRef.current.emit('send-room-message', {
       roomId: currentRoom._id,
       content,
       timestamp: Date.now()
     });
  }, [currentRoom]);
  
  // Comprehensive cleanup
  const disconnect = useCallback(() => {
    
    // Stop VAD
    stopVAD();
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Disconnect audio nodes
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    gainNodeRef.current = null;
    
    // Close peer connections
    peerConnectionsRef.current.forEach(connection => {
      connection.close();
    });
    peerConnectionsRef.current.clear();
    
    // Clear ICE candidate buffers
    iceCandidateBufferRef.current.clear();
    
    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
             // Reset state
    setIsConnected(false);
    setIsConnecting(false);
    setStatus('disconnected');
    setCurrentRoom(null);
    setParticipants([]);
    setRemoteStreams({});
    setMessages([]);
    setConnectionError(null);
    setReconnectionAttempts(0);
    setIsMuted(false);
    setIsSpeaker(false);
    setCurrentUserId(null);
    isInitializedRef.current = false;
  }, [stopVAD]);
  
  // Initialize on mount
  useEffect(() => {
    if (token && !isInitializedRef.current) {
      initializeSocket();
    }
    
    return () => {
      disconnect();
    };
  }, [token, initializeSocket, disconnect]);
  
  // Start VAD when microphone is available and in room
  useEffect(() => {
    if (localStreamRef.current && currentRoom && isConnected) {
      const cleanup = startVAD();
      return cleanup;
    }
  }, [currentRoom, isConnected, startVAD]);
  
  return {
    rooms,
    currentRoom,
    joinRoom,
    leaveRoom,
    createRoom,
    isMuted,
    isSpeaker,
    isConnected,
    toggleMute,
    toggleSpeaker,
    requestMicrophone,
    localStream: localStreamRef.current,
    remoteStreams,
    participants,
    messages,
    sendMessage,
    isConnecting,
    connectionError,
    reconnectionAttempts,
    status,
    isInitialized: isInitializedRef.current,
    socket: socketRef.current,
    disconnect
  };
};
