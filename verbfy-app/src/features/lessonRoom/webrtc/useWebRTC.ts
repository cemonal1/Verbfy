import { useState, useCallback } from 'react';

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

  const toggleMic = useCallback(() => {
    setIsMicOn(!isMicOn);
  }, [isMicOn]);

  const toggleCamera = useCallback(() => {
    setIsCameraOn(!isCameraOn);
  }, [isCameraOn]);

  const reconnect = useCallback(() => {
    // Placeholder implementation
    console.log('Reconnecting to room:', roomId);
  }, [roomId]);

  const toggleRemoteMute = useCallback((peerId: string) => {
    setMuteStates(prev => ({ ...prev, [peerId]: !prev[peerId] }));
  }, []);

  const toggleRemoteVideo = useCallback((peerId: string) => {
    setVideoStates(prev => ({ ...prev, [peerId]: !prev[peerId] }));
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
  };
} 