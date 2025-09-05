import { useState, useEffect, useCallback, useRef } from 'react';
import { microphonePermissionManager, MicrophoneDevice, MicrophonePermissionState } from '@/utils/microphonePermission';

export interface UseMicrophonePermissionReturn {
  // Permission state
  permissionState: MicrophonePermissionState;
  isSupported: boolean;
  isGranted: boolean;
  isDenied: boolean;
  canRequest: boolean;
  
  // Device info
  devices: MicrophoneDevice[];
  currentDevice: MicrophoneDevice | null;
  
  // Stream info
  currentStream: MediaStream | null;
  isActive: boolean;
  
  // Quality info
  quality: {
    isWorking: boolean;
    hasAudio: boolean;
    volumeLevel: number;
    quality: 'excellent' | 'good' | 'poor' | 'none';
  };
  
  // Actions
  requestPermission: (constraints?: any) => Promise<{ success: boolean; stream?: MediaStream; error?: string }>;
  stopMicrophone: () => void;
  testQuality: () => Promise<void>;
  refreshDevices: () => Promise<void>;
  
  // Browser compatibility
  browserCompatibility: {
    getUserMedia: boolean;
    permissionsAPI: boolean;
    audioContext: boolean;
    webRTC: boolean;
    https: boolean;
  };
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useMicrophonePermission = (): UseMicrophonePermissionReturn => {
  const [permissionState, setPermissionState] = useState<MicrophonePermissionState>(
    microphonePermissionManager.getPermissionState()
  );
  const [devices, setDevices] = useState<MicrophoneDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<MicrophoneDevice | null>(null);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [quality, setQuality] = useState({
    isWorking: false,
    hasAudio: false,
    volumeLevel: 0,
    quality: 'none' as 'excellent' | 'good' | 'poor' | 'none',
  });
  const [error, setError] = useState<string | null>(null);
  
  const qualityTestIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get browser compatibility info
  const browserCompatibility = microphonePermissionManager.getBrowserCompatibility();

  // Update permission state
  const updatePermissionState = useCallback(() => {
    const newState = microphonePermissionManager.getPermissionState();
    setPermissionState(newState);
    setError(newState.error || null);
  }, []);

  // Refresh devices list
  const refreshDevices = useCallback(async () => {
    try {
      const deviceList = await microphonePermissionManager.getMicrophoneDevices();
      setDevices(deviceList);
      
      // Set current device if we have a stream
      if (currentStream && deviceList.length > 0) {
        const audioTrack = currentStream.getAudioTracks()[0];
        if (audioTrack) {
          const device = deviceList.find(d => d.deviceId === audioTrack.getSettings().deviceId);
          setCurrentDevice(device || deviceList[0]);
        }
      }
    } catch (error) {
      console.error('Failed to refresh devices:', error);
    }
  }, [currentStream]);

  // Request microphone permission
  const requestPermission = useCallback(async (constraints?: any) => {
    try {
      setError(null);
      const result = await microphonePermissionManager.requestMicrophonePermission(constraints);
      
      if (result.success && result.stream) {
        setCurrentStream(result.stream);
        setIsActive(true);
        await refreshDevices();
        
        // Start quality monitoring
        startQualityMonitoring(result.stream);
      } else {
        setError(result.error || 'Failed to access microphone');
      }
      
      updatePermissionState();
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      setError(errorMessage);
      updatePermissionState();
      return { success: false, error: errorMessage };
    }
  }, [refreshDevices, updatePermissionState]);

  // Stop microphone
  const stopMicrophone = useCallback(() => {
    microphonePermissionManager.stopMicrophone();
    setCurrentStream(null);
    setIsActive(false);
    setQuality({
      isWorking: false,
      hasAudio: false,
      volumeLevel: 0,
      quality: 'none',
    });
    
    if (qualityTestIntervalRef.current) {
      clearInterval(qualityTestIntervalRef.current);
      qualityTestIntervalRef.current = null;
    }
    
    updatePermissionState();
  }, [updatePermissionState]);

  // Test microphone quality
  const testQuality = useCallback(async () => {
    if (currentStream) {
      try {
        const qualityResult = await microphonePermissionManager.testMicrophoneQuality(currentStream);
        setQuality(qualityResult);
      } catch (error) {
        console.error('Quality test failed:', error);
      }
    }
  }, [currentStream]);

  // Start quality monitoring
  const startQualityMonitoring = useCallback((stream: MediaStream) => {
    if (qualityTestIntervalRef.current) {
      clearInterval(qualityTestIntervalRef.current);
    }

    qualityTestIntervalRef.current = setInterval(async () => {
      try {
        const qualityResult = await microphonePermissionManager.testMicrophoneQuality(stream);
        setQuality(qualityResult);
        
        // Update active state based on quality
        setIsActive(qualityResult.isWorking);
      } catch (error) {
        console.error('Quality monitoring failed:', error);
        setIsActive(false);
      }
    }, 2000); // Test every 2 seconds
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    updatePermissionState();
    refreshDevices();
    
    // Set up periodic permission state updates
    const interval = setInterval(updatePermissionState, 5000);
    
    return () => {
      clearInterval(interval);
      if (qualityTestIntervalRef.current) {
        clearInterval(qualityTestIntervalRef.current);
      }
    };
  }, [updatePermissionState, refreshDevices]);

  // Monitor stream changes
  useEffect(() => {
    if (currentStream) {
      const audioTrack = currentStream.getAudioTracks()[0];
      if (audioTrack) {
        const handleTrackEnd = () => {
          console.log('🎤 Audio track ended');
          setIsActive(false);
          setQuality(prev => ({ ...prev, isWorking: false, quality: 'none' }));
        };

        const handleTrackMute = () => {
          console.log('🔇 Audio track muted');
          setIsActive(false);
        };

        const handleTrackUnmute = () => {
          console.log('🔊 Audio track unmuted');
          setIsActive(true);
        };

        audioTrack.addEventListener('ended', handleTrackEnd);
        audioTrack.addEventListener('mute', handleTrackMute);
        audioTrack.addEventListener('unmute', handleTrackUnmute);

        return () => {
          audioTrack.removeEventListener('ended', handleTrackEnd);
          audioTrack.removeEventListener('mute', handleTrackMute);
          audioTrack.removeEventListener('unmute', handleTrackUnmute);
        };
      }
    }
  }, [currentStream]);

  return {
    // Permission state
    permissionState,
    isSupported: permissionState.isSupported,
    isGranted: permissionState.isGranted,
    isDenied: permissionState.isDenied,
    canRequest: permissionState.canRequest,
    
    // Device info
    devices,
    currentDevice,
    
    // Stream info
    currentStream,
    isActive,
    
    // Quality info
    quality,
    
    // Actions
    requestPermission,
    stopMicrophone,
    testQuality,
    refreshDevices,
    
    // Browser compatibility
    browserCompatibility,
    
    // Error handling
    error,
    clearError,
  };
};
