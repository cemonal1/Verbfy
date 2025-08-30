import api from './api';
import { VerbfyTalkRoom, CreateRoomData, RoomFilters, VerbfyTalkMessage } from '@/types/verbfyTalk';

export const verbfyTalkAPI = {
  // Get all rooms with filters
  getRooms: async (filters: RoomFilters) => {
    const response = await api.get('/api/verbfy-talk/rooms', { params: filters });
    return response.data;
  },

  // Get a specific room
  getRoom: async (roomId: string) => {
    const response = await api.get(`/api/verbfy-talk/rooms/${roomId}`);
    return response.data;
  },

  // Create a new room
  createRoom: async (roomData: CreateRoomData) => {
    const response = await api.post('/api/verbfy-talk/rooms', roomData);
    return response.data;
  },

  // Join a room
  joinRoom: async (roomId: string, password?: string) => {
    const response = await api.post(`/api/verbfy-talk/rooms/${roomId}/join`, { password });
    return response.data;
  },

  // Leave a room
  leaveRoom: async (roomId: string) => {
    const response = await api.post(`/api/verbfy-talk/rooms/${roomId}/leave`);
    return response.data;
  },

  // Get room messages
  getMessages: async (roomId: string, page = 1, limit = 50) => {
    const response = await api.get(`/api/verbfy-talk/rooms/${roomId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Send a message
  sendMessage: async (roomId: string, content: string) => {
    const response = await api.post(`/api/verbfy-talk/rooms/${roomId}/messages`, { content });
    return response.data;
  },

  // Get room participants
  getParticipants: async (roomId: string) => {
    const response = await api.get(`/api/verbfy-talk/rooms/${roomId}/participants`);
    return response.data;
  },

  // Update participant status (mute/unmute)
  updateParticipantStatus: async (roomId: string, isMuted: boolean) => {
    const response = await api.patch(`/api/verbfy-talk/rooms/${roomId}/participant-status`, {
      isMuted
    });
    return response.data;
  },

  // Get room statistics
  getStats: async () => {
    const response = await api.get('/api/verbfy-talk/stats');
    return response.data;
  },

  // Delete a room (only for room creator)
  deleteRoom: async (roomId: string) => {
    const response = await api.delete(`/api/verbfy-talk/rooms/${roomId}`);
    return response.data;
  }
};
