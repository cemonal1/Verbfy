import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export const setSocketIO = (io: SocketIOServer): void => {
  ioInstance = io;
};

export const getSocketIO = (): SocketIOServer => {
  if (!ioInstance) {
    throw new Error('Socket.IO instance not initialized. Call setSocketIO first.');
  }
  return ioInstance;
};
