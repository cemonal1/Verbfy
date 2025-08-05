import React, { useEffect } from 'react';
import {
  VideoConference,
  GridLayout,
  ParticipantTile,
  ControlBar,
  useTracks,
  RoomAudioRenderer
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useLiveKit } from '../../context/LiveKitContext';
import '@livekit/components-styles';

interface LiveKitRoomProps {
  roomName: string;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export const LiveKitRoom: React.FC<LiveKitRoomProps> = ({
  roomName,
  onError,
  onConnected,
  onDisconnected
}) => {
  const { room, isConnecting, error, connect, disconnect } = useLiveKit();

  useEffect(() => {
    if (roomName) {
      connect(roomName)
        .then(() => {
          console.log('✅ Connected to LiveKit room:', roomName);
          onConnected?.();
        })
        .catch((err) => {
          console.error('❌ Failed to connect to LiveKit room:', err);
          onError?.(err);
        });
    }

    return () => {
      disconnect();
      onDisconnected?.();
    };
  }, [roomName, connect, disconnect, onConnected, onDisconnected, onError]);

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4">Connecting to room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <p>Failed to connect: {error.message}</p>
          <button
            onClick={() => connect(roomName)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Room not connected</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <VideoConference>
        <GridLayout tracks={useTracks()}>
          <ParticipantTile />
        </GridLayout>
        <RoomAudioRenderer />
        <ControlBar />
      </VideoConference>
    </div>
  );
}; 