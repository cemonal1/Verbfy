import { useState, useCallback, useEffect, useRef } from 'react';

interface PeerIds {
  self: string;
  remote?: string;
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
  const [isInitializing, setIsInitializing] = useState(false);
  
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize media stream on component mount
  useEffect(() => {
    initializeMediaStream();
    
    // Cleanup on unmount
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  const initializeMediaStream = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      setStatus('connecting');

      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support media access. Please use a modern browser like Chrome, Firefox, Safari, or Edge.');
      }

      console.log('🎤 Requesting microphone and camera access...');

      // Check permissions first
      try {
        const permissions = await Promise.all([
          navigator.permissions.query({ name: 'microphone' as PermissionName }),
          navigator.permissions.query({ name: 'camera' as PermissionName })
        ]);

        console.log('📋 Current permissions:', {
          microphone: permissions[0].state,
          camera: permissions[1].state
        });

        if (permissions[0].state === 'denied' || permissions[1].state === 'denied') {
          throw new Error('Media permissions are denied. Please allow microphone and camera access in your browser settings.');
        }
      } catch (permErr) {
        console.warn('⚠️ Could not check permissions:', permErr);
        // Continue anyway, as some browsers don't support permissions API
      }

      // Request user media with proper constraints
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        },
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ Media access granted:', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setStatus('connected');

      // Set initial track states
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      
      if (audioTrack) {
        audioTrack.enabled = isMicOn;
        // Add event listeners for track ended
        audioTrack.addEventListener('ended', () => {
          console.warn('🎤 Audio track ended');
          setError('Microphone access was lost. Please refresh the page.');
        });
      }
      
      if (videoTrack) {
        videoTrack.enabled = isCameraOn;
        // Add event listeners for track ended
        videoTrack.addEventListener('ended', () => {
          console.warn('📹 Video track ended');
          setError('Camera access was lost. Please refresh the page.');
        });
      }

    } catch (err: any) {
      console.error('❌ Failed to access media devices:', err);
      
      let errorMessage = 'Failed to access microphone and camera';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone and camera access denied. Please click the camera/microphone icon in your browser\'s address bar and select "Allow", then refresh the page.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone or camera found. Please check that your devices are connected and working properly.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Microphone or camera is already in use by another application. Please close other applications using your camera/microphone and try again.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints cannot be satisfied. Trying with basic settings...';
        
        // Try with basic constraints
        try {
          console.log('🔄 Trying with basic media constraints...');
          const basicStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
          });
          
          localStreamRef.current = basicStream;
          setLocalStream(basicStream);
          setStatus('connected');
          console.log('✅ Connected with basic media constraints');
          return;
        } catch (basicErr) {
          console.error('❌ Failed with basic constraints too:', basicErr);
          errorMessage = 'Failed to access media devices even with basic settings. Please check your browser permissions and device connections.';
        }
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Media access blocked due to security restrictions. Please ensure you\'re using HTTPS and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setStatus('error');
    } finally {
      setIsInitializing(false);
    }
  };

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const newMicState = !isMicOn;
        audioTrack.enabled = newMicState;
        setIsMicOn(newMicState);
        console.log(`🎤 Microphone ${newMicState ? 'enabled' : 'disabled'}`);
      }
    }
  }, [isMicOn]);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const newCameraState = !isCameraOn;
        videoTrack.enabled = newCameraState;
        setIsCameraOn(newCameraState);
        console.log(`📹 Camera ${newCameraState ? 'enabled' : 'disabled'}`);
      }
    }
  }, [isCameraOn]);

  const reconnect = useCallback(async () => {
    console.log('🔄 Reconnecting to room:', roomId);
    setStatus('reconnecting');
    
    // Stop existing stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Reinitialize
    await initializeMediaStream();
  }, [roomId]);

  const toggleRemoteMute = useCallback((peerId: string) => {
    setMuteStates(prev => ({ ...prev, [peerId]: !prev[peerId] }));
  }, []);

  const toggleRemoteVideo = useCallback((peerId: string) => {
    setVideoStates(prev => ({ ...prev, [peerId]: !prev[peerId] }));
  }, []);

  // Check if browser supports required APIs
  const checkBrowserSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support media devices. Please use a modern browser like Chrome, Firefox, or Safari.');
      return false;
    }
    return true;
  };

  // Initialize browser support check
  useEffect(() => {
    if (!checkBrowserSupport()) {
      setStatus('error');
    }
  }, []);

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
    isInitializing,
  };
}