import React, { createContext, useContext, useState, useCallback } from 'react';
import { Room, RoomOptions } from 'livekit-client';
import api from '../lib/api';

interface LiveKitContextType {
  room: Room | null;
  isConnecting: boolean;
  error: Error | null;
  connect: (roomName: string) => Promise<void>;
  disconnect: () => void;
}

const LiveKitContext = createContext<LiveKitContextType | undefined>(undefined);

export const useLiveKit = () => {
  const context = useContext(LiveKitContext);
  if (!context) {
    throw new Error('useLiveKit must be used within a LiveKitProvider');
  }
  return context;
};

interface LiveKitProviderProps {
  children: React.ReactNode;
}

export const LiveKitProvider: React.FC<LiveKitProviderProps> = ({ children }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(async (roomName: string) => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get token from backend
      const response = await api.post(`/api/livekit/token/${roomName}`);
      const { token, url } = response.data;

      // Initialize room options
      const roomOptions: RoomOptions = {
        adaptiveStream: true,
        dynacast: true,
        stopLocalTrackOnUnpublish: true
      };

      // Create and connect room
      const newRoom = new Room(roomOptions);
      await newRoom.connect(url, token);

      setRoom(newRoom);
    } catch (err) {
      console.error('Failed to connect to LiveKit room:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (room) {
      room.disconnect();
      setRoom(null);
    }
  }, [room]);

  return (
    <LiveKitContext.Provider
      value={{
        room,
        isConnecting,
        error,
        connect,
        disconnect
      }}
    >
      {children}
    </LiveKitContext.Provider>
  );
}; 