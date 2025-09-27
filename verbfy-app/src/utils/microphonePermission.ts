/**
 * Comprehensive Microphone Permission Management
 * Handles all aspects of microphone access, validation, and fallback mechanisms
 */

export interface MicrophoneDevice {
  deviceId: string;
  label: string;
  kind: string;
  groupId: string;
}

export interface MicrophonePermissionState {
  isSupported: boolean;
  isGranted: boolean;
  isDenied: boolean;
  isPrompted: boolean;
  canRequest: boolean;
  lastChecked: number;
  error?: string;
}

export interface MicrophoneConstraints {
  audio: {
    deviceId?: { exact: string } | string;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    sampleRate: number;
    channelCount: number;
    latency: number;
  };
  video: boolean;
}

export class MicrophonePermissionManager {
  private static instance: MicrophonePermissionManager;
  private permissionState: MicrophonePermissionState;
  private devices: MicrophoneDevice[] = [];
  private currentStream: MediaStream | null = null;

  private constructor() {
    this.permissionState = {
      isSupported: false,
      isGranted: false,
      isDenied: false,
      isPrompted: false,
      canRequest: false,
      lastChecked: 0,
    };
    this.initializePermissionState();
  }

  public static getInstance(): MicrophonePermissionManager {
    if (!MicrophonePermissionManager.instance) {
      MicrophonePermissionManager.instance = new MicrophonePermissionManager();
    }
    return MicrophonePermissionManager.instance;
  }

  /**
   * Initialize permission state and check browser support
   */
  private initializePermissionState(): void {
    // Check if getUserMedia is supported
    this.permissionState.isSupported = !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );

    if (!this.permissionState.isSupported) {
      this.permissionState.error = 'getUserMedia is not supported in this browser';
      return;
    }

    // Check if permissions API is supported
    if ('permissions' in navigator) {
      this.checkPermissionStatus();
    } else {
      // Fallback for browsers without Permissions API
      this.permissionState.canRequest = true;
    }
  }

  /**
   * Check current permission status using Permissions API
   */
  private async checkPermissionStatus(): Promise<void> {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      this.permissionState.isGranted = permission.state === 'granted';
      this.permissionState.isDenied = permission.state === 'denied';
      this.permissionState.canRequest = permission.state !== 'denied';
      this.permissionState.lastChecked = Date.now();

      // Listen for permission changes
      permission.addEventListener('change', () => {
        this.permissionState.isGranted = permission.state === 'granted';
        this.permissionState.isDenied = permission.state === 'denied';
        this.permissionState.canRequest = permission.state !== 'denied';
        this.permissionState.lastChecked = Date.now();
      });
    } catch (error) {
      console.warn('Permissions API not fully supported:', error);
      this.permissionState.canRequest = true;
    }
  }

  /**
   * Get available microphone devices
   */
  public async getMicrophoneDevices(): Promise<MicrophoneDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
          groupId: device.groupId,
        }));
      return this.devices;
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return [];
    }
  }

  /**
   * Request microphone permission with comprehensive error handling
   */
  public async requestMicrophonePermission(
    constraints?: Partial<MicrophoneConstraints>
  ): Promise<{ success: boolean; stream?: MediaStream; error?: string }> {
    if (!this.permissionState.isSupported) {
      return {
        success: false,
        error: 'Microphone access is not supported in this browser. Please use a modern browser like Chrome, Firefox, Safari, or Edge.',
      };
    }

    if (this.permissionState.isDenied) {
      return {
        success: false,
        error: 'Microphone access has been permanently denied. Please enable microphone access in your browser settings and refresh the page.',
      };
    }

    try {
      // Default constraints with high quality settings
      const defaultConstraints: MicrophoneConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
          latency: 0.01,
        },
        video: false,
      };

      const finalConstraints: MediaStreamConstraints = { 
        audio: {
          ...defaultConstraints.audio,
          ...(constraints?.audio || {}),
        },
        video: constraints?.video ?? defaultConstraints.video,
      };
      this.permissionState.isPrompted = true;

      console.log('🎤 Requesting microphone access with constraints:', finalConstraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(finalConstraints);
      
      this.currentStream = stream;
      this.permissionState.isGranted = true;
      this.permissionState.isDenied = false;
      this.permissionState.lastChecked = Date.now();
      this.permissionState.error = undefined;

      console.log('✅ Microphone access granted successfully');
      
      // Get device info
      await this.getMicrophoneDevices();

      return { success: true, stream };
    } catch (error: unknown) {
      this.permissionState.isGranted = false;
      this.permissionState.lastChecked = Date.now();
      
      const errorMessage = this.getDetailedErrorMessage(error);
      this.permissionState.error = errorMessage;

      console.error('❌ Microphone access failed:', error);
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get detailed error message based on error type
   */
  private getDetailedErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      const errorMessages = {
        NotAllowedError: 'Microphone access was denied. Please click "Allow" when prompted, or enable microphone access in your browser settings.',
        NotFoundError: 'No microphone device found. Please connect a microphone and try again.',
        NotSupportedError: 'Microphone access is not supported in this browser. Please use a modern browser.',
        NotReadableError: 'Microphone is already in use by another application. Please close other applications using the microphone and try again.',
        AbortError: 'Microphone access request was cancelled. Please try again.',
        SecurityError: 'Microphone access is blocked due to security restrictions. Please ensure you are using HTTPS.',
        InvalidStateError: 'Microphone is in an invalid state. Please refresh the page and try again.',
        TypeError: 'Invalid microphone constraints. Please try again.',
        UnknownError: 'An unknown error occurred while accessing the microphone. Please try again.',
      };

      return errorMessages[error.name as keyof typeof errorMessages] || 
             `Microphone access failed: ${error.message || 'Unknown error'}`;
    }
    
    return 'Microphone access failed: Unknown error';
  }

  /**
   * Test microphone quality and functionality
   */
  public async testMicrophoneQuality(stream: MediaStream): Promise<{
    isWorking: boolean;
    hasAudio: boolean;
    volumeLevel: number;
    quality: 'excellent' | 'good' | 'poor' | 'none';
  }> {
    try {
      const audioContext = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      source.connect(analyser);
      analyser.fftSize = 256;

      // Test for 1 second
      return new Promise((resolve) => {
        let samples = 0;
        let totalVolume = 0;
        let hasAudioSamples = 0;

        const testInterval = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          
          totalVolume += average;
          samples++;
          
          if (average > 10) {
            hasAudioSamples++;
          }

          if (samples >= 10) { // Test for 1 second (10 * 100ms)
            clearInterval(testInterval);
            
            const avgVolume = totalVolume / samples;
            const audioRatio = hasAudioSamples / samples;
            
            let quality: 'excellent' | 'good' | 'poor' | 'none';
            if (audioRatio > 0.7 && avgVolume > 20) {
              quality = 'excellent';
            } else if (audioRatio > 0.4 && avgVolume > 10) {
              quality = 'good';
            } else if (audioRatio > 0.1 && avgVolume > 5) {
              quality = 'poor';
            } else {
              quality = 'none';
            }

            resolve({
              isWorking: quality !== 'none',
              hasAudio: audioRatio > 0.1,
              volumeLevel: avgVolume,
              quality,
            });

            // Cleanup
            source.disconnect();
            analyser.disconnect();
            audioContext.close();
          }
        }, 100);
      });
    } catch (error) {
      console.error('Microphone quality test failed:', error);
      return {
        isWorking: false,
        hasAudio: false,
        volumeLevel: 0,
        quality: 'none',
      };
    }
  }

  /**
   * Stop current microphone stream
   */
  public stopMicrophone(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Microphone track stopped');
      });
      this.currentStream = null;
    }
  }

  /**
   * Get current permission state
   */
  public getPermissionState(): MicrophonePermissionState {
    return { ...this.permissionState };
  }

  /**
   * Check if microphone is currently active
   */
  public isMicrophoneActive(): boolean {
    return this.currentStream !== null && 
           this.currentStream.getAudioTracks().some(track => track.readyState === 'live');
  }

  /**
   * Get browser compatibility info
   */
  public getBrowserCompatibility(): {
    getUserMedia: boolean;
    permissionsAPI: boolean;
    audioContext: boolean;
    webRTC: boolean;
    https: boolean;
  } {
    return {
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      permissionsAPI: 'permissions' in navigator,
      audioContext: !!(window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext),
      webRTC: !!(window.RTCPeerConnection || (window as { webkitRTCPeerConnection?: typeof RTCPeerConnection }).webkitRTCPeerConnection),
      https: location.protocol === 'https:' || location.hostname === 'localhost',
    };
  }

  /**
   * Reset permission state (useful for testing)
   */
  public resetPermissionState(): void {
    this.stopMicrophone();
    this.permissionState = {
      isSupported: false,
      isGranted: false,
      isDenied: false,
      isPrompted: false,
      canRequest: false,
      lastChecked: 0,
    };
    this.initializePermissionState();
  }
}

// Export singleton instance
export const microphonePermissionManager = MicrophonePermissionManager.getInstance();
