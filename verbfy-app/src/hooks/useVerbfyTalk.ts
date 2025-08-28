import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface VerbfyTalkRoom {
  id: string;
  name: string;
  participants: number;
  maxParticipants: number;
  isActive: boolean;
}

interface VerbfyTalkParticipant {
  id: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
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
  isConnected: boolean;
  toggleMute: () => void;
  requestMicrophone: () => Promise<boolean>;
  
  // Participants
  participants: VerbfyTalkParticipant[];
  
  // Connection status
  isConnecting: boolean;
  connectionError: string | null;
  
  // Cleanup
  disconnect: () => void;
}

export const useVerbfyTalk = (token: string): UseVerbfyTalkReturn => {
  const [rooms, setRooms] = useState<VerbfyTalkRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<VerbfyTalkRoom | null>(null);
  const [participants, setParticipants] = useState<VerbfyTalkParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  
  // Initialize Socket.IO connection
  const initializeSocket = useCallback(async () => {
    if (!token) return;
    
    try {
      setIsConnecting(true);
      setConnectionError(null);
      
      const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.verbfy.com', {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        forceNew: true,
        withCredentials: true,
        auth: { token },
        timeout: 20000,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      
      socket.on('connect', () => {
        console.log('🔌 VerbfyTalk connected:', socket.id);
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
      });
      
      socket.on('disconnect', (reason) => {
        console.log('🔌 VerbfyTalk disconnected:', reason);
        setIsConnected(false);
        setCurrentRoom(null);
        setParticipants([]);
      });
      
      socket.on('connect_error', (error) => {
        console.error('🔌 VerbfyTalk connection error:', error);
        setConnectionError(error.message);
        setIsConnecting(false);
      });
      
      // Room events
      socket.on('rooms:list', (roomsList: VerbfyTalkRoom[]) => {
        setRooms(roomsList);
      });
      
      socket.on('room:joined', (room: VerbfyTalkRoom) => {
        setCurrentRoom(room);
        console.log('🎤 Joined room:', room.name);
      });
      
      socket.on('room:left', () => {
        setCurrentRoom(null);
        setParticipants([]);
        console.log('🎤 Left room');
      });
      
      // Participant events
      socket.on('participants:update', (participantsList: VerbfyTalkParticipant[]) => {
        setParticipants(participantsList);
      });
      
      socket.on('participant:joined', (participant: VerbfyTalkParticipant) => {
        console.log('👤 Participant joined:', participant.name);
      });
      
      socket.on('participant:left', (participantId: string) => {
        console.log('👤 Participant left:', participantId);
      });
      
      // WebRTC signaling
      socket.on('webrtc:offer', async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
        await handleWebRTCOffer(data.from, data.offer);
      });
      
      socket.on('webrtc:answer', async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
        await handleWebRTCAnswer(data.from, data.answer);
      });
      
      socket.on('webrtc:ice-candidate', async (data: { from: string; candidate: RTCIceCandidateInit }) => {
        await handleICECandidate(data.from, data.candidate);
      });
      
      socketRef.current = socket;
      
      // Request rooms list
      socket.emit('rooms:get');
      
    } catch (error) {
      console.error('❌ Failed to initialize VerbfyTalk:', error);
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
      setIsConnecting(false);
    }
  }, [token]);
  
  // WebRTC handlers
  const handleWebRTCOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      
      peerConnectionsRef.current.set(from, peerConnection);
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current!);
        });
      }
      
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socketRef.current?.emit('webrtc:answer', { to: from, answer });
      
    } catch (error) {
      console.error('❌ WebRTC offer handling failed:', error);
    }
  };
  
  const handleWebRTCAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error('❌ WebRTC answer handling failed:', error);
    }
  };
  
  const handleICECandidate = async (from: string, candidate: RTCIceCandidateInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('❌ ICE candidate handling failed:', error);
    }
  };
  
  // Room management
  const joinRoom = useCallback(async (roomId: string): Promise<boolean> => {
    if (!socketRef.current || !isConnected) return false;
    
    try {
      socketRef.current.emit('room:join', { roomId });
      return true;
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      return false;
    }
  }, [isConnected]);
  
  const leaveRoom = useCallback(() => {
    if (!socketRef.current || !currentRoom) return;
    
    socketRef.current.emit('room:leave', { roomId: currentRoom.id });
  }, [currentRoom]);
  
  const createRoom = useCallback(async (name: string): Promise<string | null> => {
    if (!socketRef.current || !isConnected) return null;
    
    try {
      return new Promise((resolve) => {
        socketRef.current!.emit('room:create', { name }, (response: { success: boolean; roomId?: string }) => {
          if (response.success && response.roomId) {
            resolve(response.roomId);
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('❌ Failed to create room:', error);
      return null;
    }
  }, [isConnected]);
  
  // Audio controls
  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      localStreamRef.current = stream;
      
      // Set up audio context for volume control
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Mute initially
      gainNode.gain.value = 0;
      
      console.log('🎤 Microphone access granted');
      return true;
      
    } catch (error) {
      console.error('❌ Microphone access denied:', error);
      setConnectionError('Microphone access denied. Please allow microphone permissions.');
      return false;
    }
  }, []);
  
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        
        // Notify other participants
        socketRef.current?.emit('participant:mute', { 
          roomId: currentRoom?.id, 
          isMuted: !audioTrack.enabled 
        });
      }
    }
  }, [currentRoom]);
  
  // Cleanup
  const disconnect = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    peerConnectionsRef.current.forEach(connection => connection.close());
    peerConnectionsRef.current.clear();
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setCurrentRoom(null);
    setParticipants([]);
    setConnectionError(null);
  }, []);
  
  // Initialize on mount
  useEffect(() => {
    if (token) {
      initializeSocket();
    }
    
    return () => {
      disconnect();
    };
  }, [token, initializeSocket, disconnect]);
  
  return {
    rooms,
    currentRoom,
    joinRoom,
    leaveRoom,
    createRoom,
    isMuted,
    isConnected,
    toggleMute,
    requestMicrophone,
    participants,
    isConnecting,
    connectionError,
    disconnect
  };
};
