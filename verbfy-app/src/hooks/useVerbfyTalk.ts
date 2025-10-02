import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { tokenStorage } from '@/utils/secureStorage';
import { createLogger } from '@/utils/logger';

// Create context-specific logger
const verbfyTalkLogger = createLogger('VerbfyTalk');

interface VerbfyTalkRoom {
  _id: string;
  name: string;
  description: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  participants: Array<{
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    joinedAt: string;
    isActive: boolean;
  }>;
  isPrivate: boolean;
  maxParticipants: number;
  level: string;
  topic: string;
}

interface Participant {
  id: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isSpeaker: boolean;
}

interface VerbfyTalkParticipant {
  id: string;
  name: string;
  userId: string;
  joinedAt: string;
  isActive: boolean;
}

interface VerbfyTalkMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export const useVerbfyTalk = () => {
  const { user } = useAuth();
  const token = tokenStorage.getToken();
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<VerbfyTalkRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking] = useState(false); // Read-only, managed by VAD
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});

  // WebRTC Configuration
  const WEBRTC_CONFIG = useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }), []);

  // Initialize peer connection
  const initializePeerConnection = useCallback(async (participantId: string) => {
    try {
      const peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);
      peerConnectionsRef.current.set(participantId, peerConnection);
      peerConnections.current[participantId] = peerConnection;

      // Add local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current?.connected) {
          socketRef.current.emit('webrtc:ice-candidate', {
            to: participantId,
            candidate: event.candidate
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event: RTCTrackEvent) => {
        verbfyTalkLogger.info('Remote audio stream received', { participantId });
        const [remoteStream] = event.streams;
        setRemoteStreams(prev => ({
          ...prev,
          [participantId]: remoteStream
        }));
      };

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (socketRef.current?.connected) {
        socketRef.current.emit('webrtc:offer', {
          to: participantId,
          offer: offer
        });
      }
    } catch (error) {
      verbfyTalkLogger.error('Failed to create peer connection:', error);
    }
  }, [WEBRTC_CONFIG]);

  // Create peer connection
  const createPeerConnection = useCallback(async (participantId: string) => {
    return initializePeerConnection(participantId);
  }, [initializePeerConnection]);

  // WebRTC handlers
  const handleOffer = useCallback(async (from: string, offer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);
      peerConnectionsRef.current.set(from, peerConnection);
      peerConnections.current[from] = peerConnection;

      // Add local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current?.connected) {
          socketRef.current.emit('webrtc:ice-candidate', {
            to: from,
            candidate: event.candidate
          });
        }
      };

      // Handle remote audio stream
      peerConnection.ontrack = (event: RTCTrackEvent) => {
        verbfyTalkLogger.info('Remote audio stream received', { participantId: from });
        const [remoteStream] = event.streams;
        setRemoteStreams(prev => ({
          ...prev,
          [from]: remoteStream
        }));
      };

      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (socketRef.current?.connected) {
        socketRef.current.emit('webrtc:answer', {
          to: from,
          answer: answer
        });
      }
    } catch (error) {
      verbfyTalkLogger.error('Failed to handle offer:', error);
    }
  }, [WEBRTC_CONFIG]);

  const handleAnswer = useCallback(async (from: string, answer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    } catch (error) {
      verbfyTalkLogger.error('Failed to handle answer:', error);
    }
  }, []);

  const handleICECandidate = useCallback(async (from: string, candidate: RTCIceCandidateInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection && peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(candidate);
      }
    } catch (error) {
      verbfyTalkLogger.error('Failed to handle ICE candidate:', error);
    }
  }, []);

  // Initialize Socket Connection
  useEffect(() => {
    if (!user || !token) {
      verbfyTalkLogger.warn('No user or token available');
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    verbfyTalkLogger.info('Attempting to connect', { backendUrl });
    verbfyTalkLogger.debug('User info', { name: user?.name, hasToken: !!token });

    const newSocket = io(backendUrl, {
      auth: {
        token: token
      },
      transports: ['polling'], // Start with polling only for stability
      upgrade: true, // Allow upgrade to websocket
      rememberUpgrade: true, // Remember successful upgrades
      timeout: 20000, // 20 second timeout
      forceNew: true, // Force new connection
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      withCredentials: true
    });

    socketRef.current = newSocket;

    // Connection events
    newSocket.on('connect', () => {
      verbfyTalkLogger.info('Connected to server successfully');
      verbfyTalkLogger.debug('Socket ID', { socketId: newSocket.id });
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      verbfyTalkLogger.warn('Disconnected from server', { reason });
      setIsConnected(false);
      setCurrentRoom(null);
      setParticipants([]);
      setRemoteStreams({});
      
      // Clean up peer connections
      Object.values(peerConnections.current).forEach((pc: RTCPeerConnection) => pc.close());
      peerConnections.current = {};
      peerConnectionsRef.current.clear();
    });

    newSocket.on('reconnect', (attemptNumber) => {
      verbfyTalkLogger.info('Reconnected after attempts', { attemptNumber });
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      verbfyTalkLogger.debug('Reconnection attempt', { attemptNumber });
    });

    newSocket.on('reconnect_error', (error) => {
      verbfyTalkLogger.error('Reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      verbfyTalkLogger.error('Reconnection failed after all attempts');
    });

    // Room events
    newSocket.on('room:joined', (room: VerbfyTalkRoom) => {
      verbfyTalkLogger.info('Joined room', { roomName: room.name });
      setCurrentRoom(room);
      
      // Convert room participants to Participant format
      const convertedParticipants: Participant[] = room.participants.map(p => ({
        id: p.userId._id,
        name: p.userId.name,
        isSpeaking: false,
        isMuted: false,
        isSpeaker: false
      }));
      
      setParticipants(convertedParticipants);
      setMessages([]);
      
      // Initialize WebRTC connections with existing participants
      if (room.participants && room.participants.length > 0) {
        verbfyTalkLogger.info('Initializing WebRTC connections', { participantCount: room.participants.length });
        room.participants.forEach(participant => {
          if (participant.userId._id !== user?.id) {
            initializePeerConnection(participant.userId._id);
          }
        });
      }
    });

    newSocket.on('participant:joined', (participant: VerbfyTalkParticipant) => {
      verbfyTalkLogger.info('Participant joined', { name: participant.name });
      
      const newParticipant: Participant = {
        id: participant.id,
        name: participant.name,
        isSpeaking: false,
        isMuted: false,
        isSpeaker: false
      };
      
      setParticipants(prev => [...prev, newParticipant]);
      
      // Initialize peer connection for new participant
      if (participant.id !== user?.id) {
        initializePeerConnection(participant.id);
      }
    });

    newSocket.on('participant:left', (participantId: string) => {
      verbfyTalkLogger.info('Participant left', { participantId });
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      
      // Clean up peer connection
      if (peerConnections.current[participantId]) {
        verbfyTalkLogger.debug('Closing peer connection', { participantId });
        peerConnections.current[participantId].close();
        delete peerConnections.current[participantId];
      }
      
      if (peerConnectionsRef.current.has(participantId)) {
        peerConnectionsRef.current.get(participantId)?.close();
        peerConnectionsRef.current.delete(participantId);
      }
    });

    newSocket.on('message:received', (message: VerbfyTalkMessage) => {
      verbfyTalkLogger.debug('Message received', { message: message.message });
      setMessages(prev => [...prev, message]);
    });

    // WebRTC events
    newSocket.on('webrtc:offer', async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      await handleOffer(data.from, data.offer);
    });

    newSocket.on('webrtc:answer', async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      await handleAnswer(data.from, data.answer);
    });

    newSocket.on('webrtc:ice-candidate', async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      await handleICECandidate(data.from, data.candidate);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user, token, initializePeerConnection, handleOffer, handleAnswer, handleICECandidate]);

  // Join room
  const joinRoom = useCallback(async (roomId: string, password?: string) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to server');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // First, join room via HTTP API
      const response = await fetch(`/api/verbfy-talk/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join room');
      }

      const result = await response.json();
      verbfyTalkLogger.info('HTTP API join successful', { roomName: result.data.name });
      return result.data;
    } catch (error) {
      verbfyTalkLogger.error('Failed to join room via HTTP API', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Set microphone stream (called from MicrophonePermissionScreen)
  const setMicrophoneStream = useCallback((stream: MediaStream) => {
    localStreamRef.current = stream;
    verbfyTalkLogger.info('Microphone stream set in useVerbfyTalk');
    
    // Update all existing peer connections with the new stream
    Object.values(peerConnections.current).forEach((pc: RTCPeerConnection) => {
      const sender = pc.getSenders().find((s: RTCRtpSender) => s.track?.kind === 'audio');
      if (sender && stream.getAudioTracks()[0]) {
        sender.replaceTrack(stream.getAudioTracks()[0]);
      } else if (stream.getAudioTracks()[0]) {
        pc.addTrack(stream.getAudioTracks()[0], stream);
      }
    });
  }, []);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (socketRef.current?.connected && currentRoom) {
      socketRef.current.emit('room:leave', { roomId: currentRoom._id });
    }
    
    // Clean up
    setCurrentRoom(null);
    setParticipants([]);
    setMessages([]);
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    Object.values(peerConnections.current).forEach((pc: RTCPeerConnection) => pc.close());
    peerConnections.current = {};
  }, [currentRoom]);

  // Send message
  const sendMessage = useCallback((message: string) => {
    if (socketRef.current?.connected && currentRoom) {
      verbfyTalkLogger.debug('Sending message', { roomId: currentRoom._id, message: message.trim() });
      socketRef.current.emit('message:send', {
        roomId: currentRoom._id,
        message: message.trim()
      });
    }
  }, [currentRoom]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  return {
    // Connection state
    isConnected,
    isLoading,
    error,
    connectionError,
    
    // Room state
    currentRoom,
    participants,
    messages,
    
    // Audio state
    isMuted,
    isSpeaking,
    remoteStreams,
    
    // Actions
    joinRoom,
    leaveRoom,
    sendMessage,
    toggleMute,
    createPeerConnection,
    setMicrophoneStream,
    
    // Cleanup
    setError
  };
};
