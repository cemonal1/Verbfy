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

      console.log('🎤 Requesting microphone and camera access...');

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
      }
      
      if (videoTrack) {
        videoTrack.enabled = isCameraOn;
      }

    } catch (err: any) {
      console.error('❌ Failed to access media devices:', err);
      
      let errorMessage = 'Failed to access microphone and camera';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone and camera access denied. Please allow access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone or camera found. Please check your devices.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Microphone or camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints cannot be satisfied. Trying with basic settings...';
        
        // Try with basic constraints
        try {
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
        }
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