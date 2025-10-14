import api from './api';
import {
  CreateRoomData,
  RoomFilters,
  VerbfyTalkMessage,
  RoomsResponse,
  RoomResponse,
  VerbfyTalkParticipant,
  VerbfyTalkStats
} from '@/types/verbfyTalk';

export const verbfyTalkAPI = {
  // Get all rooms with filters
  getRooms: async (filters: RoomFilters): Promise<RoomsResponse> => {
    const response = await api.get('/api/verbfy-talk/rooms', { params: filters });
    return response.data as RoomsResponse;
  },

  // Get a specific room
  getRoom: async (roomId: string): Promise<RoomResponse> => {
    const response = await api.get(`/api/verbfy-talk/rooms/${roomId}`);
    return response.data as RoomResponse;
  },

  // Create a new room
  createRoom: async (roomData: CreateRoomData): Promise<RoomResponse> => {
    const response = await api.post('/api/verbfy-talk/rooms', roomData);
    return response.data as RoomResponse;
  },

  // Join a room
  joinRoom: async (roomId: string, password?: string): Promise<unknown> => {
    const response = await api.post(`/api/verbfy-talk/rooms/${roomId}/join`, { password });
    return response.data as unknown;
  },

  // Leave a room
  leaveRoom: async (roomId: string): Promise<unknown> => {
    const response = await api.post(`/api/verbfy-talk/rooms/${roomId}/leave`);
    return response.data as unknown;
  },

  // Get room messages
  getMessages: async (roomId: string, page = 1, limit = 50): Promise<VerbfyTalkMessage[]> => {
    const response = await api.get(`/api/verbfy-talk/rooms/${roomId}/messages`, {
      params: { page, limit }
    });
    return response.data as VerbfyTalkMessage[];
  },

  // Send a message
  sendMessage: async (roomId: string, content: string) => {
    const response = await api.post(`/api/verbfy-talk/rooms/${roomId}/messages`, { content });
    return response.data;
  },

  // Get room participants
  getParticipants: async (roomId: string): Promise<VerbfyTalkParticipant[]> => {
    const response = await api.get(`/api/verbfy-talk/rooms/${roomId}/participants`);
    return response.data as VerbfyTalkParticipant[];
  },

  // Update participant status (mute/unmute)
  updateParticipantStatus: async (roomId: string, isMuted: boolean): Promise<unknown> => {
    const response = await api.patch(`/api/verbfy-talk/rooms/${roomId}/participant-status`, {
      isMuted
    });
    return response.data as unknown;
  },

  // Get room statistics
  getStats: async (): Promise<VerbfyTalkStats> => {
    const response = await api.get('/api/verbfy-talk/stats');
    return response.data as VerbfyTalkStats;
  },

  // Delete a room (only for room creator)
  deleteRoom: async (roomId: string): Promise<unknown> => {
    const response = await api.delete(`/api/verbfy-talk/rooms/${roomId}`);
    return response.data as unknown;
  }
};
