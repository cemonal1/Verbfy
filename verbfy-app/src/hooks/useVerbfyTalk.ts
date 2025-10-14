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
  const [connectedRooms, setConnectedRooms] = useState<Map<string, VerbfyTalkRoom>>(new Map());
  const [roomParticipants, setRoomParticipants] = useState<Map<string, Participant[]>>(new Map());
  const [roomMessages, setRoomMessages] = useState<Map<string, Message[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking] = useState(false); // Read-only, managed by VAD
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  
  // Backward compatibility - current room (first connected room)
  const currentRoom = useMemo(() => {
    const rooms = Array.from(connectedRooms.values());
    return rooms.length > 0 ? rooms[0] : null;
  }, [connectedRooms]);
  
  const participants = useMemo(() => {
    if (currentRoom) {
      return roomParticipants.get(currentRoom._id) || [];
    }
    return [];
  }, [currentRoom, roomParticipants]);
  
  const messages = useMemo(() => {
    if (currentRoom) {
      return roomMessages.get(currentRoom._id) || [];
    }
    return [];
  }, [currentRoom, roomMessages]);
  
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // Room-based peer connections: roomId -> participantId -> RTCPeerConnection
  const roomPeerConnections = useRef<Map<string, Map<string, RTCPeerConnection>>>(new Map());
  // Backward compatibility
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});

  // WebRTC Configuration
  const WEBRTC_CONFIG = useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }), []);

  // Initialize peer connection for a specific room
  const initializePeerConnection = useCallback(async (participantId: string, roomId: string) => {
    try {
      const peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);
      
      // Store in room-based structure
      if (!roomPeerConnections.current.has(roomId)) {
        roomPeerConnections.current.set(roomId, new Map());
      }
      roomPeerConnections.current.get(roomId)!.set(participantId, peerConnection);
      
      // Backward compatibility
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
            candidate: event.candidate,
            roomId: roomId
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event: RTCTrackEvent) => {
        verbfyTalkLogger.info('Remote audio stream received', { participantId, roomId });
        const [remoteStream] = event.streams;
        setRemoteStreams(prev => ({
          ...prev,
          [`${roomId}-${participantId}`]: remoteStream
        }));
      };

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (socketRef.current?.connected) {
        socketRef.current.emit('webrtc:offer', {
          to: participantId,
          offer: offer,
          roomId: roomId
        });
      }
    } catch (error) {
      verbfyTalkLogger.error('Failed to create peer connection:', error);
    }
  }, [WEBRTC_CONFIG]);

  // Create peer connection
  const createPeerConnection = useCallback(async (participantId: string, roomId: string) => {
    return initializePeerConnection(participantId, roomId);
  }, [initializePeerConnection]);

  // WebRTC handlers
  const handleOffer = useCallback(async (from: string, offer: RTCSessionDescriptionInit, roomId: string) => {
    try {
      const peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);
      
      // Store in room-based peer connections
      if (!roomPeerConnections.current.has(roomId)) {
        roomPeerConnections.current.set(roomId, new Map());
      }
      roomPeerConnections.current.get(roomId)!.set(from, peerConnection);
      
      // Backward compatibility
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
            roomId: roomId,
            candidate: event.candidate
          });
        }
      };

      // Handle remote audio stream
      peerConnection.ontrack = (event: RTCTrackEvent) => {
        verbfyTalkLogger.info('Remote audio stream received', { participantId: from, roomId });
        const [remoteStream] = event.streams;
        setRemoteStreams(prev => ({
          ...prev,
          [`${roomId}-${from}`]: remoteStream
        }));
      };

      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (socketRef.current?.connected) {
        socketRef.current.emit('webrtc:answer', {
          to: from,
          roomId: roomId,
          answer: answer
        });
      }
    } catch (error) {
      verbfyTalkLogger.error('Failed to handle offer:', error);
    }
  }, [WEBRTC_CONFIG]);

  const handleAnswer = useCallback(async (from: string, answer: RTCSessionDescriptionInit, roomId: string) => {
    try {
      // Try room-based peer connection first
      const roomConnections = roomPeerConnections.current.get(roomId);
      let peerConnection = roomConnections?.get(from);
      
      // Fallback to backward compatibility
      if (!peerConnection) {
        peerConnection = peerConnectionsRef.current.get(from);
      }
      
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    } catch (error) {
      verbfyTalkLogger.error('Failed to handle answer:', error);
    }
  }, []);

  const handleICECandidate = useCallback(async (from: string, candidate: RTCIceCandidateInit, roomId: string) => {
    try {
      // Try room-based peer connection first
      const roomConnections = roomPeerConnections.current.get(roomId);
      let peerConnection = roomConnections?.get(from);
      
      // Fallback to backward compatibility
      if (!peerConnection) {
        peerConnection = peerConnectionsRef.current.get(from);
      }
      
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
      setConnectedRooms(new Map());
      setRoomParticipants(new Map());
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
    newSocket.on('room:joined', (data: { room: VerbfyTalkRoom; roomId: string }) => {
      const { room, roomId } = data;
      verbfyTalkLogger.info('Joined room', { roomName: room.name, roomId });
      
      // Update connected rooms
      setConnectedRooms(prev => new Map(prev).set(roomId, room));
      
      // Convert room participants to Participant format
      const convertedParticipants: Participant[] = room.participants.map(p => ({
        id: p.userId._id,
        name: p.userId.name,
        isSpeaking: false,
        isMuted: false,
        isSpeaker: false
      }));
      
      // Update room participants
      setRoomParticipants(prev => new Map(prev).set(roomId, convertedParticipants));
      setRoomMessages(prev => new Map(prev).set(roomId, []));
      
      // Initialize WebRTC connections with existing participants
      if (room.participants && room.participants.length > 0) {
        verbfyTalkLogger.info('Initializing WebRTC connections', { participantCount: room.participants.length, roomId });
        room.participants.forEach(participant => {
          if (participant.userId._id !== user?.id) {
            initializePeerConnection(participant.userId._id, roomId);
          }
        });
      }
    });

    newSocket.on('participant:joined', (data: { participant: VerbfyTalkParticipant; roomId: string }) => {
      const { participant, roomId } = data;
      verbfyTalkLogger.info('Participant joined', { name: participant.name, roomId });
      
      const newParticipant: Participant = {
        id: participant.id,
        name: participant.name,
        isSpeaking: false,
        isMuted: false,
        isSpeaker: false
      };
      
      // Update room participants
      setRoomParticipants(prev => {
        const newParticipants = new Map(prev);
        const currentParticipants = newParticipants.get(roomId) || [];
        newParticipants.set(roomId, [...currentParticipants, newParticipant]);
        return newParticipants;
      });
      
      // Initialize peer connection for new participant
      if (participant.id !== user?.id) {
        initializePeerConnection(participant.id, roomId);
      }
    });

    newSocket.on('participant:left', (data: { participantId: string; roomId: string }) => {
      const { participantId, roomId } = data;
      verbfyTalkLogger.info('Participant left', { participantId, roomId });
      
      // Update room participants
      setRoomParticipants(prev => {
        const newParticipants = new Map(prev);
        const currentParticipants = newParticipants.get(roomId) || [];
        newParticipants.set(roomId, currentParticipants.filter(p => p.id !== participantId));
        return newParticipants;
      });
      
      // Clean up peer connection for this room
      const roomPeerConns = roomPeerConnections.current.get(roomId);
      if (roomPeerConns?.has(participantId)) {
        verbfyTalkLogger.debug('Closing peer connection', { participantId, roomId });
        roomPeerConns.get(participantId)?.close();
        roomPeerConns.delete(participantId);
      }
      
      // Clean up backward compatibility connections
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

    newSocket.on('message:received', (data: { message: VerbfyTalkMessage; roomId: string }) => {
      verbfyTalkLogger.debug('Message received', { message: data.message.message, roomId: data.roomId });
      setRoomMessages(prev => {
        const updated = new Map(prev);
        const currentMessages = updated.get(data.roomId) || [];
        updated.set(data.roomId, [...currentMessages, data.message]);
        return updated;
      });
    });

    // WebRTC events
    newSocket.on('webrtc:offer', async (data: { from: string; offer: RTCSessionDescriptionInit; roomId: string }) => {
      await handleOffer(data.from, data.offer, data.roomId);
    });

    newSocket.on('webrtc:answer', async (data: { from: string; answer: RTCSessionDescriptionInit; roomId: string }) => {
      await handleAnswer(data.from, data.answer, data.roomId);
    });

    newSocket.on('webrtc:ice-candidate', async (data: { from: string; candidate: RTCIceCandidateInit; roomId: string }) => {
      await handleICECandidate(data.from, data.candidate, data.roomId);
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

    // Check if already connected to this room
    if (connectedRooms.has(roomId)) {
      verbfyTalkLogger.info('Already connected to room', { roomId });
      return connectedRooms.get(roomId);
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
      
      // Store room data
      setConnectedRooms(prev => new Map(prev).set(roomId, result.data));
      setRoomParticipants(prev => new Map(prev).set(roomId, []));
      setRoomMessages(prev => new Map(prev).set(roomId, []));
      
      // Join room via Socket.IO
      socketRef.current.emit('room:join', { roomId });
      
      return result.data;
    } catch (error) {
      verbfyTalkLogger.error('Failed to join room via HTTP API', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [token, connectedRooms]);

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
  const leaveRoom = useCallback((roomId?: string) => {
    const targetRoomId = roomId || currentRoom?._id;
    
    if (!targetRoomId) {
      verbfyTalkLogger.warn('No room to leave');
      return;
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit('room:leave', { roomId: targetRoomId });
    }
    
    // Remove room from connected rooms
    setConnectedRooms(prev => {
      const newRooms = new Map(prev);
      newRooms.delete(targetRoomId);
      return newRooms;
    });
    
    // Remove room participants and messages
    setRoomParticipants(prev => {
      const newParticipants = new Map(prev);
      newParticipants.delete(targetRoomId);
      return newParticipants;
    });
    
    setRoomMessages(prev => {
      const newMessages = new Map(prev);
      newMessages.delete(targetRoomId);
      return newMessages;
    });
    
    // Close peer connections for this room
    const roomPeerConns = roomPeerConnections.current.get(targetRoomId);
    if (roomPeerConns) {
      roomPeerConns.forEach(pc => pc.close());
      roomPeerConnections.current.delete(targetRoomId);
    }
    
    // Clean up backward compatibility connections if this was the current room
    if (targetRoomId === currentRoom?._id) {
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      Object.values(peerConnections.current).forEach((pc: RTCPeerConnection) => pc.close());
      peerConnections.current = {};
    }
    
    // If leaving all rooms, stop local stream
    if (connectedRooms.size === 1 && connectedRooms.has(targetRoomId)) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    }
  }, [currentRoom, connectedRooms]);
  
  // Leave all rooms
  const leaveAllRooms = useCallback(() => {
    const roomIds = Array.from(connectedRooms.keys());
    roomIds.forEach(roomId => leaveRoom(roomId));
  }, [connectedRooms, leaveRoom]);

  // Send message
  const sendMessage = useCallback((message: string, roomId?: string) => {
    const targetRoomId = roomId || currentRoom?._id;
    if (socketRef.current?.connected && targetRoomId) {
      verbfyTalkLogger.debug('Sending message', { roomId: targetRoomId, message: message.trim() });
      socketRef.current.emit('message:send', {
        roomId: targetRoomId,
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
    
    // Room state (backward compatibility)
    currentRoom,
    participants,
    messages,
    
    // Multiple room state
    connectedRooms,
    roomParticipants,
    roomMessages,
    
    // Audio state
    isMuted,
    isSpeaking,
    remoteStreams,
    
    // Actions
    joinRoom,
    leaveRoom,
    leaveAllRooms,
    sendMessage,
    toggleMute,
    createPeerConnection,
    setMicrophoneStream,
    
    // Cleanup
    setError
  };
};
