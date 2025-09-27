import React, { useState, useEffect } from 'react';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';
import {
  MicrophoneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface MicrophonePermissionScreenProps {
  onPermissionGranted: (stream: MediaStream) => void;
  onCancel: () => void;
  roomName?: string;
}

export default function MicrophonePermissionScreen({
  onPermissionGranted,
  onCancel,
  roomName = 'VerbfyTalk Room',
}: MicrophonePermissionScreenProps) {
  const {
    isSupported,
    isGranted,
    isDenied,
    canRequest,
    devices,
    currentStream,
    isActive,
    quality,
    requestPermission,
    stopMicrophone,
    testQuality,
    refreshDevices,
    browserCompatibility,
    error,
    clearError,
  } = useMicrophonePermission();

  const [isRequesting, setIsRequesting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  // Define handleRequestPermission first to avoid hoisting issues
  const handleRequestPermission = async () => {
    setIsRequesting(true);
    clearError();
    
    const constraints = selectedDevice ? {
      audio: {
        deviceId: { exact: selectedDevice },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1,
        latency: 0.01,
      },
      video: false,
    } : undefined;

    const result = await requestPermission(constraints);
    
    if (result.success) {
      console.log('✅ Microphone permission granted');
    } else {
      console.error('❌ Microphone permission failed:', result.error);
    }
    
    setIsRequesting(false);
  };

  const handleRetry = async () => {
    stopMicrophone();
    await refreshDevices();
    await handleRequestPermission();
  };

  const handleTestQuality = async () => {
    await testQuality();
  };

  // Auto-request permission if supported and not denied
  useEffect(() => {
    if (isSupported && canRequest && !isGranted && !isDenied) {
      handleRequestPermission();
    }
  }, [isSupported, canRequest, isGranted, isDenied, handleRequestPermission]);

  // Call onPermissionGranted when stream is available
  useEffect(() => {
    if (currentStream && isActive && quality.isWorking) {
      onPermissionGranted(currentStream);
    }
  }, [currentStream, isActive, quality.isWorking, onPermissionGranted]);

  const getStatusIcon = () => {
    if (isRequesting) {
      return <ArrowPathIcon className="w-16 h-16 text-blue-600 animate-spin" />;
    }
    
    if (isGranted && isActive && quality.isWorking) {
      return <CheckCircleIcon className="w-16 h-16 text-green-600" />;
    }
    
    if (isDenied) {
      return <XCircleIcon className="w-16 h-16 text-red-600" />;
    }
    
    if (!isSupported) {
      return <ExclamationTriangleIcon className="w-16 h-16 text-yellow-600" />;
    }
    
    return <MicrophoneIcon className="w-16 h-16 text-blue-600" />;
  };

  const getStatusMessage = () => {
    if (isRequesting) {
      return 'Requesting microphone access...';
    }
    
    if (isGranted && isActive && quality.isWorking) {
      return `Microphone access granted! Quality: ${quality.quality}`;
    }
    
    if (isDenied) {
      return 'Microphone access was denied. Please enable it in your browser settings.';
    }
    
    if (!isSupported) {
      return 'Microphone access is not supported in this browser.';
    }
    
    if (error) {
      return error;
    }
    
    return 'Microphone access is required for voice chat.';
  };

  const getStatusColor = () => {
    if (isGranted && isActive && quality.isWorking) {
      return 'text-green-600';
    }
    
    if (isDenied || error) {
      return 'text-red-600';
    }
    
    if (!isSupported) {
      return 'text-yellow-600';
    }
    
    return 'text-blue-600';
  };

  const getQualityIndicator = () => {
    if (!isActive || !quality.isWorking) return null;
    
    const qualityColors = {
      excellent: 'bg-green-500',
      good: 'bg-blue-500',
      poor: 'bg-yellow-500',
      none: 'bg-red-500',
    };
    
    return (
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className={`w-3 h-3 rounded-full ${qualityColors[quality.quality]} animate-pulse`}></div>
        <span className="text-sm text-gray-400">
          Quality: {quality.quality} | Volume: {Math.round(quality.volumeLevel)}
        </span>
      </div>
    );
  };

  const renderBrowserCompatibility = () => {
    if (!showAdvanced) return null;
    
    return (
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <h4 className="text-sm font-semibold text-white mb-3">Browser Compatibility</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className={`w-4 h-4 ${browserCompatibility.getUserMedia ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-gray-300">getUserMedia</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className={`w-4 h-4 ${browserCompatibility.permissionsAPI ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-gray-300">Permissions API</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className={`w-4 h-4 ${browserCompatibility.audioContext ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-gray-300">Audio Context</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className={`w-4 h-4 ${browserCompatibility.webRTC ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-gray-300">WebRTC</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className={`w-4 h-4 ${browserCompatibility.https ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-gray-300">HTTPS</span>
          </div>
        </div>
      </div>
    );
  };

  const renderDeviceSelection = () => {
    if (!showAdvanced || devices.length === 0) return null;
    
    return (
      <div className="mt-4">
        <label className="block text-sm font-medium text-white mb-2">
          Select Microphone Device
        </label>
        <select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Default Device</option>
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-center max-w-md mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          {getStatusIcon()}
          <h2 className="text-2xl font-bold text-white mt-4 mb-2">
            Microphone Access Required
          </h2>
          <p className="text-gray-300 mb-4">
            {roomName} needs access to your microphone for voice chat.
          </p>
        </div>

        {/* Status Message */}
        <div className={`mb-6 p-4 rounded-lg bg-gray-800 ${getStatusColor()}`}>
          <p className="text-sm font-medium">{getStatusMessage()}</p>
          {getQualityIndicator()}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Error</span>
            </div>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isGranted && canRequest && !isRequesting && (
            <button
              onClick={handleRequestPermission}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Allow Microphone Access
            </button>
          )}

          {isGranted && isActive && (
            <button
              onClick={handleTestQuality}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Test Microphone Quality
            </button>
          )}

          {(isDenied || error) && (
            <button
              onClick={handleRetry}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Retry Microphone Access
            </button>
          )}

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="mt-6">
            {renderDeviceSelection()}
            {renderBrowserCompatibility()}
          </div>
        )}

        {/* Information */}
        <div className="mt-6 text-sm text-gray-400 space-y-1">
          <p>• Your microphone will only be used for voice chat</p>
          <p>• You can mute/unmute anytime during the conversation</p>
          <p>• No audio is recorded or stored</p>
          <p>• Microphone access can be revoked in browser settings</p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="mt-6 text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Rooms
        </button>
      </div>
    </div>
  );
}
