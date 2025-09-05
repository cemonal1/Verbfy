import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { tokenStorage } from '@/utils/secureStorage';

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<VerbfyTalkRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // WebRTC Configuration
  const WEBRTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Initialize Socket Connection
  useEffect(() => {
    if (!user || !token) return;

    const newSocket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.verbfy.com'}`, {
      auth: {
        token: token
      },
      transports: ['polling', 'websocket']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to VerbfyTalk server');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from VerbfyTalk server:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setError('Failed to connect to server');
    });

    // Room events
    newSocket.on('room:joined', (room: VerbfyTalkRoom) => {
      console.log('✅ Joined room:', room.name);
      setCurrentRoom(room);
      setParticipants(room.participants.map(p => ({
        id: p.userId._id,
        name: p.userId.name,
        isSpeaking: false,
        isMuted: false,
        isSpeaker: false
      })));
      setError(null);
    });

    newSocket.on('room:error', (data: { message: string }) => {
      console.error('❌ Room error:', data.message);
      setError(data.message);
    });

    newSocket.on('participant:joined', (participant: Participant) => {
      console.log('👤 Participant joined:', participant.name);
      setParticipants(prev => [...prev, participant]);
    });

    newSocket.on('participant:left', (participantId: string) => {
      console.log('👋 Participant left:', participantId);
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    });

    newSocket.on('message:received', (message: Message) => {
      console.log('💬 Message received:', message.message);
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
  }, [user, token]);

  // Get user's microphone stream
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('❌ Failed to get microphone access:', error);
      setError('Microphone access denied');
      return null;
    }
  }, []);

  // Join room
  const joinRoom = useCallback(async (roomId: string, password?: string) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to server');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get microphone access
      const stream = await getLocalStream();
      if (!stream) {
        setIsLoading(false);
        return false;
      }

      // Join room via Socket.IO
      socketRef.current.emit('room:join', { roomId, password });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      setError('Failed to join room');
      setIsLoading(false);
      return false;
    }
  }, [getLocalStream]);

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
  }, [currentRoom]);

  // Send message
  const sendMessage = useCallback((message: string) => {
    if (socketRef.current?.connected && currentRoom) {
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

  // WebRTC handlers
  const handleOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);
      peerConnectionsRef.current.set(from, peerConnection);

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

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('🎵 Remote audio stream received from:', from);
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
      console.error('❌ Failed to handle offer:', error);
    }
  };

  const handleAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error('❌ Failed to handle answer:', error);
    }
  };

  const handleICECandidate = async (from: string, candidate: RTCIceCandidateInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection && peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('❌ Failed to handle ICE candidate:', error);
    }
  };

  return {
    // Connection state
    isConnected,
    isLoading,
    error,
    
    // Room state
    currentRoom,
    participants,
    messages,
    
    // Audio state
    isMuted,
    isSpeaking,
    
    // Actions
    joinRoom,
    leaveRoom,
    sendMessage,
    toggleMute,
    
    // Cleanup
    setError
  };
};
