import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  MicrophoneIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

function MediaTestPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissions, setPermissions] = useState({
    camera: 'unknown' as 'granted' | 'denied' | 'unknown' | 'testing',
    microphone: 'unknown' as 'granted' | 'denied' | 'unknown' | 'testing'
  });
  const [error, setError] = useState<string | null>(null);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    return () => {
      // Cleanup
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream]);

  const testMediaAccess = async () => {
    try {
      setError(null);
      setPermissions({
        camera: 'testing',
        microphone: 'testing'
      });

      console.log('🎤📹 Testing media access...');

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      setStream(mediaStream);

      // Test video
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Test audio
      setupAudioAnalysis(mediaStream);

      const hasVideo = mediaStream.getVideoTracks().length > 0;
      const hasAudio = mediaStream.getAudioTracks().length > 0;

      setPermissions({
        camera: hasVideo ? 'granted' : 'denied',
        microphone: hasAudio ? 'granted' : 'denied'
      });

      console.log('✅ Media access test completed:', { hasVideo, hasAudio });

    } catch (err: any) {
      console.error('❌ Media access test failed:', err);
      
      let errorMessage = 'Failed to access media devices';
      let cameraStatus: 'granted' | 'denied' = 'denied';
      let microphoneStatus: 'granted' | 'denied' = 'denied';

      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera and microphone access denied. Please allow access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found. Please check your devices.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera or microphone is already in use by another application.';
      }

      setError(errorMessage);
      setPermissions({
        camera: cameraStatus,
        microphone: microphoneStatus
      });
    }
  };

  const setupAudioAnalysis = (mediaStream: MediaStream) => {
    const audioTrack = mediaStream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(mediaStream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      startAudioLevelMonitoring();
    } catch (err) {
      console.error('Failed to setup audio analysis:', err);
    }
  };

  const startAudioLevelMonitoring = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = Math.min(100, (average / 128) * 100);
      
      setAudioLevel(normalizedLevel);
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };
    
    updateAudioLevel();
  };

  const testAudioPlayback = () => {
    setIsTestingAudio(true);
    
    // Play a test tone
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
    
    setTimeout(() => {
      setIsTestingAudio(false);
      audioContext.close();
    }, 600);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'denied':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      case 'testing':
        return <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />;
    }
  };

  return (
    <DashboardLayout allowedRoles={['student', 'teacher']}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/verbfy-talk')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Media Test</h1>
            <p className="text-gray-600 mt-2">Test your camera and microphone before joining a room</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Test */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <VideoCameraIcon className="w-6 h-6" />
              Camera Test
            </h2>
            
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(permissions.camera)}
                <span className="text-sm font-medium">
                  Camera: {permissions.camera === 'granted' ? 'Working' : 
                           permissions.camera === 'denied' ? 'Access Denied' :
                           permissions.camera === 'testing' ? 'Testing...' : 'Not Tested'}
                </span>
              </div>
            </div>
          </div>

          {/* Audio Test */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MicrophoneIcon className="w-6 h-6" />
              Microphone Test
            </h2>
            
            {/* Audio Level Indicator */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Speak to test your microphone:</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all duration-100"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Audio Level: {Math.round(audioLevel)}%
              </div>
            </div>

            {/* Speaker Test */}
            <div className="mb-4">
              <button
                onClick={testAudioPlayback}
                disabled={isTestingAudio}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded transition-colors"
              >
                {isTestingAudio ? 'Playing Test Sound...' : 'Test Speakers'}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Click to play a test sound through your speakers
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(permissions.microphone)}
                <span className="text-sm font-medium">
                  Microphone: {permissions.microphone === 'granted' ? 'Working' : 
                              permissions.microphone === 'denied' ? 'Access Denied' :
                              permissions.microphone === 'testing' ? 'Testing...' : 'Not Tested'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Media Access Error</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <div className="mt-3 text-sm text-red-600">
                  <p className="font-medium">To fix this:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Click the camera/microphone icon in your browser's address bar</li>
                    <li>Select "Allow" for both camera and microphone</li>
                    <li>Refresh the page and test again</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={testMediaAccess}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            {permissions.camera === 'testing' || permissions.microphone === 'testing' 
              ? 'Testing...' 
              : 'Test Media Access'
            }
          </button>
          
          {permissions.camera === 'granted' && permissions.microphone === 'granted' && (
            <button
              onClick={() => router.push('/verbfy-talk')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Ready to Join Rooms
            </button>
          )}
        </div>

        {/* Browser Support Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Browser Requirements</h3>
          <p className="text-blue-700 text-sm">
            VerbfyTalk works best with modern browsers like Chrome, Firefox, Safari, or Edge. 
            Make sure your browser is up to date for the best experience.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default MediaTestPage;