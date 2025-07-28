import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthContext } from '../../src/context/AuthContext';
import api from '../../src/lib/api';
import io, { Socket } from 'socket.io-client';

interface Reservation {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  actualDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
}

interface LessonMaterial {
  id: string;
  title: string;
  type: 'document' | 'video' | 'audio' | 'image' | 'presentation';
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
  thumbnail?: string;
}

export default function TalkPage() {
  const router = useRouter();
  const { reservationId } = router.query;
  const { user, accessToken } = useAuthContext();
  
  // Add debug logging for reservationId
  useEffect(() => {
    console.log('🔍 Router query:', router.query);
    console.log('🔍 Reservation ID from router:', reservationId);
    console.log('🔍 Router is ready:', router.isReady);
  }, [router.query, reservationId, router.isReady]);
  
  // Refs for video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [volume, setVolume] = useState(50);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  
  // Media streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaStatus, setMediaStatus] = useState<'unavailable' | 'requesting' | 'granted' | 'denied'>('unavailable');
  
  // WebRTC and Socket.IO
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [remoteUser, setRemoteUser] = useState<{ id: string; name: string } | null>(null);

  // Remove mock materials - start with empty array
  const [lessonMaterials, setLessonMaterials] = useState<LessonMaterial[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
    type: 'text' | 'material' | 'system';
  }>>([]);
  const [chatInput, setChatInput] = useState('');

  // Mark component as mounted after initial render
  useEffect(() => {
    setIsComponentMounted(true);
  }, []);

  // Manual camera test function
  const testCamera = async () => {
    try {
      console.log('🧪 Testing camera access...');
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera access is not supported in this browser');
        return;
      }

      // Test with basic constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log('✅ Camera test successful');
      console.log('📹 Video tracks:', stream.getVideoTracks().length);
      console.log('🎤 Audio tracks:', stream.getAudioTracks().length);
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      alert('Camera test successful! Camera is working properly.');
    } catch (error: any) {
      console.error('❌ Camera test failed:', error);
      alert(`Camera test failed: ${error.message}`);
    }
  };

  // Get user media (camera and microphone)
  const getUserMedia = async () => {
    try {
      console.log('🔄 Requesting camera and microphone access...');
      setMediaStatus('requesting');
      setMediaError(null);
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera and microphone access is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('✅ Camera and microphone access granted');
      console.log('📹 Video tracks:', stream.getVideoTracks().length);
      console.log('🎤 Audio tracks:', stream.getAudioTracks().length);
      console.log('🎥 Stream active:', stream.active);
      console.log('🎥 Stream id:', stream.id);
      
      setLocalStream(stream);
      setMediaStatus('granted');
      
      // Function to set up video element with retry logic
      const setupVideoElement = (retryCount = 0) => {
        console.log(`🎥 Attempting to setup video element (attempt ${retryCount + 1})`);
        console.log('🎥 Video ref exists:', !!localVideoRef.current);
        
        if (localVideoRef.current) {
          console.log('🎥 Setting up video element...');
          console.log('🎥 Current srcObject:', localVideoRef.current.srcObject);
          
          // Clear any existing stream
          localVideoRef.current.srcObject = null;
          
          // Set the new stream
          localVideoRef.current.srcObject = stream;
          console.log('🎥 Stream set to video element');
          
          // Wait for the video element to be ready
          localVideoRef.current.onloadedmetadata = () => {
            console.log('🎥 Video metadata loaded, attempting to play...');
            console.log('🎥 Video readyState:', localVideoRef.current?.readyState);
            console.log('🎥 Video videoWidth:', localVideoRef.current?.videoWidth);
            console.log('🎥 Video videoHeight:', localVideoRef.current?.videoHeight);
            
            localVideoRef.current?.play().then(() => {
              console.log('✅ Video playing successfully');
              console.log('🎥 Video paused:', localVideoRef.current?.paused);
              console.log('🎥 Video ended:', localVideoRef.current?.ended);
            }).catch((playError) => {
              console.error('❌ Video play error:', playError);
              // Try again after a short delay
              setTimeout(() => {
                if (localVideoRef.current) {
                  console.log('🔄 Retrying video play...');
                  localVideoRef.current.play().catch(e => console.error('❌ Retry play error:', e));
                }
              }, 500);
            });
          };

          // Handle video element errors
          localVideoRef.current.onerror = (error) => {
            console.error('❌ Video element error:', error);
          };

          // Handle video element load start
          localVideoRef.current.onloadstart = () => {
            console.log('🎥 Video load started');
          };

          // Handle video element can play
          localVideoRef.current.oncanplay = () => {
            console.log('🎥 Video can play');
          };

          // Handle video element playing
          localVideoRef.current.onplaying = () => {
            console.log('🎥 Video is playing');
          };
        } else if (retryCount < 10) {
          console.warn(`⚠️ Video element ref is null, retrying... (${retryCount + 1}/10)`);
          setTimeout(() => setupVideoElement(retryCount + 1), 200);
        } else {
          console.error('❌ Failed to set up video element after 10 retries');
        }
      };

      // Start the setup process with a small delay to ensure DOM is ready
      setTimeout(() => {
        setupVideoElement();
      }, 100);
    } catch (err: any) {
      console.error('❌ Media access error:', err);
      setMediaStatus('denied');
      
      if (err.name === 'NotAllowedError') {
        setMediaError('Camera and microphone access denied. Please allow access and refresh the page.');
      } else if (err.name === 'NotFoundError') {
        setMediaError('No camera or microphone found. Please connect a device and refresh.');
      } else if (err.name === 'NotReadableError') {
        setMediaError('Camera or microphone is being used by another application. Please close other apps and refresh.');
      } else if (err.name === 'OverconstrainedError') {
        setMediaError('Camera constraints not supported. Please try with different camera settings.');
      } else if (err.name === 'TypeError') {
        setMediaError('Camera access not supported in this browser. Please use a modern browser.');
      } else {
        setMediaError(`Failed to access camera and microphone: ${err.message}`);
      }
    }
  };

  // Screen sharing functionality
  const startScreenShare = async () => {
    try {
      console.log('🔄 Starting screen share...');
      
      // Check if getDisplayMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      console.log('✅ Screen share access granted');
      console.log('🖥️ Screen tracks:', stream.getVideoTracks().length);
      
      setScreenStream(stream);
      setIsScreenSharing(true);
      
      // Function to set up screen share video element with retry logic
      const setupScreenShareElement = (retryCount = 0) => {
        if (screenShareRef.current) {
          console.log('🖥️ Setting up screen share video element...');
          screenShareRef.current.srcObject = stream;
          
          // Wait for the video element to be ready
          screenShareRef.current.onloadedmetadata = () => {
            console.log('🖥️ Screen share metadata loaded, attempting to play...');
            screenShareRef.current?.play().then(() => {
              console.log('✅ Screen share playing successfully');
            }).catch((playError) => {
              console.error('❌ Screen share play error:', playError);
              // Try again after a short delay
              setTimeout(() => {
                if (screenShareRef.current) {
                  screenShareRef.current.play().catch(e => console.error('❌ Retry screen share play error:', e));
                }
              }, 500);
            });
          };

          // Handle video element errors
          screenShareRef.current.onerror = (error) => {
            console.error('❌ Screen share video element error:', error);
          };
        } else if (retryCount < 5) {
          console.warn(`⚠️ Screen share video element ref is null, retrying... (${retryCount + 1}/5)`);
          setTimeout(() => setupScreenShareElement(retryCount + 1), 200);
        } else {
          console.error('❌ Failed to set up screen share video element after 5 retries');
        }
      };

      // Start the setup process
      setupScreenShareElement();

      // Handle screen share stop
      stream.getVideoTracks()[0].onended = () => {
        console.log('🖥️ Screen share ended by user');
        stopScreenShare();
      };
    } catch (err: any) {
      console.error('❌ Screen share error:', err);
      if (err.name === 'NotAllowedError') {
        alert('Screen sharing was denied. Please allow access to share your screen.');
      } else if (err.name === 'NotFoundError') {
        alert('No screen or window found to share. Please try again.');
      } else if (err.name === 'NotSupportedError') {
        alert('Screen sharing is not supported in this browser. Please use a modern browser.');
      } else {
        alert(`Failed to start screen sharing: ${err.message}`);
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);
    
    if (screenShareRef.current) {
      screenShareRef.current.srcObject = null;
    }
  };

  // Fetch reservation details
  useEffect(() => {
    if (!reservationId || !accessToken) return;

    const fetchReservation = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/reservations/${reservationId}`);
        setReservation(response.data);
        
        // Check if user is part of this reservation
        const isStudent = response.data.student._id === user?.id;
        const isTeacher = response.data.teacher._id === user?.id;
        
        if (!isStudent && !isTeacher) {
          setError('You do not have access to this lesson room');
          return;
        }

        // Remove time restriction - allow access anytime for development
        // In production, you might want to add a more flexible time window

      } catch (err: any) {
        console.error('Error fetching reservation:', err);
        setError(err.response?.data?.message || 'Failed to load lesson details');
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId, accessToken, user?.id]);

  // Always request camera/mic on mount, but wait for component to be fully rendered
  useEffect(() => {
    if (!isComponentMounted) return;
    
    // Only initialize camera once when component is mounted
    const timer = setTimeout(() => {
      console.log('🎥 Initializing camera on component mount');
      setMediaStatus('unavailable'); // Reset status on mount
      getUserMedia();
    }, 500); // Increased delay to ensure DOM is fully ready

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComponentMounted]); // Only depend on isComponentMounted

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, [localStream, screenStream, remoteStream, peerConnection, socket]);

  // Initialize WebRTC peer connection
  const initializePeerConnection = useCallback(() => {
    if (!localStream) {
      console.log('❌ No local stream available for peer connection');
      return null;
    }

    console.log('🔗 Initializing WebRTC peer connection...');
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ]
    });

    console.log('📹 Adding local stream tracks to peer connection...');
    
    // Add local stream tracks to peer connection
    localStream.getTracks().forEach(track => {
      console.log('📹 Adding track:', track.kind, track.id);
      pc.addTrack(track, localStream);
    });

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log('📹 Received remote stream:', event.streams.length, 'streams');
      console.log('📹 Remote tracks:', event.track.kind, event.track.id);
      
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        
        // Set up remote video element
        setTimeout(() => {
          if (remoteVideoRef.current) {
            console.log('📹 Setting remote video element...');
            remoteVideoRef.current.srcObject = event.streams[0];
            remoteVideoRef.current.play().then(() => {
              console.log('✅ Remote video playing successfully');
            }).catch(e => {
              console.error('❌ Remote video play error:', e);
            });
          } else {
            console.error('❌ Remote video ref is null');
          }
        }, 100);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('🧊 Sending ICE candidate');
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          roomId: reservationId
        });
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', pc.iceConnectionState);
    };

    // Handle ICE gathering state changes
    pc.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state:', pc.iceGatheringState);
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      setIsConnected(pc.connectionState === 'connected');
      
      if (pc.connectionState === 'connected') {
        console.log('✅ WebRTC connection established!');
      } else if (pc.connectionState === 'failed') {
        console.error('❌ WebRTC connection failed');
      }
    };

    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      console.log('📡 Signaling state:', pc.signalingState);
    };

    setPeerConnection(pc);
    console.log('✅ Peer connection initialized');
    return pc;
  }, [localStream, reservationId, socket]);

  // Initialize Socket.IO connection
  useEffect(() => {
    // Wait for router to be ready and reservationId to be available
    if (!router.isReady || !reservationId || !user || !accessToken) {
      console.log('⏳ Waiting for router or missing data:', {
        routerReady: router.isReady,
        reservationId: reservationId,
        user: !!user,
        accessToken: !!accessToken
      });
      return;
    }

    // Prevent multiple socket connections
    if (socket) {
      console.log('🔌 Socket already exists, skipping initialization');
      return;
    }

    console.log('🔌 Initializing Socket.IO connection...');
    console.log('🔑 Access token:', accessToken.substring(0, 20) + '...');
    console.log('🔌 Reservation ID for connection:', reservationId);
    
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: accessToken
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to signaling server');
      console.log('🔌 Socket ID:', newSocket.id);
      console.log('🔌 User:', user?.name, user?.id, user?.role);
      console.log('🔌 Reservation ID:', reservationId);
      
      newSocket.emit('join-room', {
        roomId: reservationId,
        userId: user.id,
        userName: user.name,
        role: user.role
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name
      });
      
      if (error.message.includes('Authentication failed')) {
        console.error('🔐 Authentication failed - check your token');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('🚫 Backend server not running - start the backend server');
      }
      
      // Fallback: continue with local video only
      console.log('🔄 Continuing with local video only (no peer connection)');
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket.IO error event:', error);
    });

    newSocket.on('room-info', (data) => {
      console.log('📋 Room info received:', data);
      console.log('📋 Users in room:', data.users);
    });

    newSocket.on('error', (data) => {
      console.error('❌ Room error received:', data);
      alert(`Room error: ${data.message}`);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected to signaling server (attempt ${attemptNumber})`);
      newSocket.emit('join-room', {
        roomId: reservationId,
        userId: user.id,
        userName: user.name,
        role: user.role
      });
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Socket.IO reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Socket.IO reconnection failed - max attempts reached');
      console.log('🔄 Continuing with local video only (no peer connection)');
    });

    newSocket.on('user-joined', (data) => {
      console.log('👤 User joined:', data);
      setRemoteUser({ id: data.userId, name: data.userName });
      
      // Initialize peer connection when another user joins
      console.log('🔗 Another user joined, initializing peer connection...');
      const pc = initializePeerConnection();
      if (pc) {
        console.log('📤 Creating offer...');
        createOffer(pc);
      } else {
        console.error('❌ Failed to initialize peer connection');
      }
    });

    newSocket.on('user-left', (data) => {
      console.log('👤 User left:', data);
      setRemoteUser(null);
      setRemoteStream(null);
      setIsConnected(false);
      
      // Close peer connection
      if (peerConnection) {
        peerConnection.close();
        setPeerConnection(null);
      }
    });

    newSocket.on('offer', async (data) => {
      console.log('📨 Received offer from:', data.userName);
      console.log('📨 Offer details:', data.offer);
      
      const pc = initializePeerConnection();
      if (pc) {
        try {
          console.log('📥 Setting remote description (offer)...');
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          console.log('✅ Remote description set successfully');
          
          console.log('📤 Creating answer...');
          const answer = await pc.createAnswer();
          console.log('📤 Answer created:', answer);
          
          console.log('📥 Setting local description (answer)...');
          await pc.setLocalDescription(answer);
          console.log('✅ Local description set successfully');
          
          console.log('📤 Sending answer to:', data.userId);
          newSocket.emit('answer', {
            answer,
            roomId: reservationId,
            targetUserId: data.userId
          });
        } catch (error) {
          console.error('❌ Error handling offer:', error);
        }
      } else {
        console.error('❌ Failed to initialize peer connection for offer');
      }
    });

    newSocket.on('answer', async (data) => {
      console.log('📨 Received answer from:', data.userName);
      console.log('📨 Answer details:', data.answer);
      
      if (peerConnection) {
        try {
          console.log('📥 Setting remote description (answer)...');
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('✅ Remote description (answer) set successfully');
        } catch (error) {
          console.error('❌ Error handling answer:', error);
        }
      } else {
        console.error('❌ No peer connection available for answer');
      }
    });

    newSocket.on('ice-candidate', async (data) => {
      console.log('🧊 Received ICE candidate from:', data.userName);
      console.log('🧊 ICE candidate:', data.candidate);
      
      if (peerConnection) {
        try {
          console.log('🧊 Adding ICE candidate...');
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('✅ ICE candidate added successfully');
        } catch (error) {
          console.error('❌ Error adding ICE candidate:', error);
        }
      } else {
        console.error('❌ No peer connection available for ICE candidate');
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from signaling server');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [router.isReady, reservationId, user?.id, accessToken]); // Added router.isReady

  // Create offer for peer connection
  const createOffer = async (pc: RTCPeerConnection) => {
    try {
      console.log('📤 Creating offer...');
      const offer = await pc.createOffer();
      console.log('📤 Offer created:', offer);
      
      console.log('📥 Setting local description (offer)...');
      await pc.setLocalDescription(offer);
      console.log('✅ Local description (offer) set successfully');
      
      if (socket) {
        console.log('📤 Sending offer to room:', reservationId);
        socket.emit('offer', {
          offer,
          roomId: reservationId
        });
        console.log('✅ Offer sent successfully');
      } else {
        console.error('❌ No socket connection available to send offer');
      }
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  };

  // Manual connection test function
  const testConnection = async () => {
    try {
      console.log('🧪 Testing WebRTC connection...');
      
      if (!localStream) {
        alert('No local stream available. Please enable camera first.');
        return;
      }
      
      if (!socket) {
        alert('No socket connection available. Please wait for connection.');
        return;
      }
      
      console.log('🔗 Creating test peer connection...');
      const pc = initializePeerConnection();
      if (pc) {
        console.log('📤 Creating test offer...');
        await createOffer(pc);
        alert('Test offer sent! Check console for connection status.');
      } else {
        alert('Failed to create peer connection.');
      }
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      alert(`Connection test failed: ${error.message}`);
    }
  };

  const handleLeaveRoom = () => {
    // Stop all media streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    router.push('/dashboard');
  };

  const handleToggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleToggleMaterials = () => {
    setIsMaterialsOpen(!isMaterialsOpen);
  };

  const handleToggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = newVolume / 100;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    try {
      setUploadingFile(true);
      
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newMaterial: LessonMaterial = {
        id: Date.now().toString(),
        title: selectedFile.name,
        type: getFileType(selectedFile.name),
        uploadedBy: user?.name || 'Unknown',
        uploadedAt: new Date().toISOString(),
        url: '#',
        thumbnail: '/api/placeholder/400/300'
      };

      setLessonMaterials(prev => [...prev, newMaterial]);
      
      // Add system message
      const systemMessage = {
        id: Date.now().toString(),
        userId: 'system',
        userName: 'System',
        message: `${user?.name} uploaded ${selectedFile.name}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system' as const
      };
      setChatMessages(prev => [...prev, systemMessage]);
      
      setShowUploadModal(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const getFileType = (fileName: string): LessonMaterial['type'] => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['mp4', 'avi', 'mov', 'webm'].includes(ext || '')) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return 'audio';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'image';
    if (['ppt', 'pptx'].includes(ext || '')) return 'presentation';
    return 'document';
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        userId: user?.id || '',
        userName: user?.name || 'Unknown',
        message: chatInput.trim(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'text' as const
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatInput('');
    }
  };

  const handleShareMaterial = (material: LessonMaterial) => {
    const materialMessage = {
      id: Date.now().toString(),
      userId: user?.id || '',
      userName: user?.name || 'Unknown',
      message: `Shared: ${material.title}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'material' as const
    };
    setChatMessages(prev => [...prev, materialMessage]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading lesson room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-gray-900 text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700">Reservation not found</p>
        </div>
      </div>
    );
  }

  const isStudent = reservation.student._id === user?.id;
  const isTeacher = reservation.teacher._id === user?.id;
  const otherPerson = isStudent ? reservation.teacher : reservation.student;
  const hasMaterials = isMaterialsOpen && lessonMaterials.length > 0;
  const hasScreenShare = isScreenSharing && screenStream;
  const hasRemoteVideo = remoteStream && isConnected;

  // Determine layout based on current state
  const getVideoLayout = () => {
    if (hasScreenShare) {
      // Screen sharing mode: large screen share, small video feeds
      return {
        mainArea: 'grid-cols-1',
        videoHeight: 'h-1/3',
        screenShareHeight: 'h-2/3'
      };
    } else if (hasMaterials) {
      // Materials mode: split between video and materials
      return {
        mainArea: 'grid-cols-1',
        videoHeight: 'h-1/2',
        screenShareHeight: 'h-1/2'
      };
    } else {
      // Normal mode: side-by-side video feeds
      return {
        mainArea: 'grid-cols-1 lg:grid-cols-2',
        videoHeight: 'h-full',
        screenShareHeight: 'h-full'
      };
    }
  };

  const layout = getVideoLayout();

  return (
    <>
      <Head>
        <title>VerbfyLesson - {otherPerson.name}</title>
        <meta name="description" content="1-on-1 English lesson with Verbfy" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <h1 className="text-xl font-bold text-gray-900">VerbfyLesson</h1>
            </div>
            <div className="text-sm text-gray-600">
              {remoteUser ? (
                <span>
                  {user?.role === 'teacher' ? 'Student' : 'Teacher'}: {remoteUser.name} 
                  {isConnected ? ' (Connected)' : ' (Connecting...)'}
                </span>
              ) : (
                <span>Waiting for {user?.role === 'teacher' ? 'student' : 'teacher'}...</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {reservation?.actualDate && (
                <span>
                  {new Date(reservation.actualDate).toLocaleDateString()} at {reservation.startTime}
                </span>
              )}
            </div>
            <button
              onClick={handleLeaveRoom}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Video Area */}
          <div className={`flex-1 flex flex-col ${hasMaterials ? 'lg:w-2/3' : 'w-full'}`}>
            {/* Video Grid */}
            <div className="flex-1 bg-gray-100 p-4">
              <div className={`grid gap-4 h-full ${layout.mainArea}`}>
                {/* Local Video */}
                <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${layout.videoHeight}`}>
                  <div className="relative h-full">
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        You
                      </div>
                    </div>
                    
                    {mediaError ? (
                      <div className="h-full flex items-center justify-center bg-gray-200">
                        <div className="text-center p-4">
                          <div className="text-red-500 text-4xl mb-2">📹</div>
                          <p className="text-gray-600 text-sm mb-2">{mediaError}</p>
                          <button
                            onClick={getUserMedia}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    ) : mediaStatus === 'requesting' ? (
                      <div className="h-full flex items-center justify-center bg-gray-200">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                          <p className="text-gray-600 text-sm">Requesting camera access...</p>
                        </div>
                      </div>
                    ) : mediaStatus === 'granted' && localStream ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover bg-gray-900"
                        style={{ minHeight: '200px' }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-gray-200">
                        <div className="text-center p-4">
                          <div className="text-gray-500 text-4xl mb-2">📹</div>
                          <p className="text-gray-600 text-sm mb-2">Camera not available</p>
                          <button
                            onClick={getUserMedia}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                          >
                            Enable Camera
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {isMuted && (
                      <div className="absolute bottom-4 left-4 z-10">
                        <div className="bg-red-500 text-white p-2 rounded-full">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remote Video */}
                <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${layout.videoHeight}`}>
                  <div className="relative h-full">
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {otherPerson.name}
                      </div>
                    </div>
                    
                    {hasRemoteVideo ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover bg-gray-900"
                        style={{ minHeight: '200px' }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-gray-200">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <p className="text-gray-600 text-sm">Waiting for {otherPerson.name}...</p>
                          {!isConnected && (
                            <p className="text-gray-500 text-xs mt-1">Connecting...</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Screen Share - Only show when active */}
                {hasScreenShare && (
                  <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${layout.screenShareHeight}`}>
                    <div className="relative h-full">
                      <div className="absolute top-4 left-4 z-10">
                        <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                          Screen Share
                        </div>
                      </div>
                      
                      <video
                        ref={screenShareRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain bg-gray-900"
                        style={{ minHeight: '200px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Control Bar */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-center space-x-4">
                {/* Mute Button */}
                <button
                  onClick={handleToggleMute}
                  className={`p-3 rounded-full transition-colors ${
                    isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMuted ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    )}
                  </svg>
                </button>

                {/* Volume Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                    className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                  {showVolumeSlider && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                        className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="text-center text-sm text-gray-600 mt-1">{volume}%</div>
                    </div>
                  )}
                </div>

                {/* Video Button */}
                <button
                  onClick={handleToggleVideo}
                  className={`p-3 rounded-full transition-colors ${
                    !isVideoOn ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {!isVideoOn ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    )}
                  </svg>
                </button>

                {/* Camera Refresh Button */}
                <button
                  onClick={getUserMedia}
                  className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  title="Refresh Camera"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

                {/* Camera Test Button */}
                <button
                  onClick={testCamera}
                  className="p-3 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                  title="Test Camera"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Connection Test Button */}
                <button
                  onClick={testConnection}
                  className="p-3 rounded-full bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                  title="Test Connection"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>

                {/* Screen Share Button */}
                <button
                  onClick={handleToggleScreenShare}
                  className={`p-3 rounded-full transition-colors ${
                    isScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* Chat Button */}
                <button
                  onClick={handleToggleChat}
                  className={`p-3 rounded-full transition-colors ${
                    isChatOpen ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>

                {/* Materials Button */}
                <button
                  onClick={handleToggleMaterials}
                  className={`p-3 rounded-full transition-colors ${
                    isMaterialsOpen ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>

                {/* Leave Button */}
                <button
                  onClick={handleLeaveRoom}
                  className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Materials Sidebar */}
          {isMaterialsOpen && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              {/* Materials Header */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Lesson Materials</h3>
                  {isTeacher && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Upload
                    </button>
                  )}
                </div>
              </div>

              {/* Materials List */}
              <div className="flex-1 overflow-y-auto p-4">
                {lessonMaterials.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No materials uploaded yet</p>
                    {isTeacher && (
                      <p className="text-sm">Click "Upload" to add lesson materials</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lessonMaterials.map((material) => (
                      <div key={material.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm mb-1">{material.title}</h4>
                            <p className="text-gray-600 text-xs mb-2">
                              Uploaded by {material.uploadedBy} on {new Date(material.uploadedAt).toLocaleDateString()}
                            </p>
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                                View
                              </button>
                              <button 
                                onClick={() => handleShareMaterial(material)}
                                className="text-green-600 hover:text-green-700 text-xs font-medium"
                              >
                                Share
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Sidebar */}
          {isChatOpen && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Chat</h3>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div key={message.id} className={`flex space-x-3 ${message.type === 'system' ? 'justify-center' : ''}`}>
                      {message.type !== 'system' && (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">
                            {message.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className={`flex-1 ${message.type === 'system' ? 'text-center' : ''}`}>
                        {message.type !== 'system' && (
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">{message.userName}</span>
                            <span className="text-xs text-gray-500">{message.timestamp}</span>
                          </div>
                        )}
                        <p className={`text-gray-700 ${message.type === 'system' ? 'text-sm text-gray-500 italic' : ''}`}>
                          {message.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Material</h3>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mp3,.ppt,.pptx"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PDF, DOC, Images, Videos, Presentations</p>
                </label>
              </div>

              {selectedFile && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">Selected: {selectedFile.name}</p>
                  <p className="text-xs text-gray-500">Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleUploadSubmit}
                  disabled={!selectedFile || uploadingFile}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingFile ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 