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

// Helper function to handle API responses and potential JSON parse errors
const handleApiResponse = async (apiCall: Promise<any>) => {
  try {
    const response = await apiCall;
    
    // Ensure response.data exists and is properly formatted
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    // If response.data is a string, try to parse it as JSON
    if (typeof response.data === 'string') {
      try {
        response.data = JSON.parse(response.data);
      } catch (parseError) {
        console.warn('Failed to parse API response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }
    }
    
    return response.data;
  } catch (error: any) {
    console.error('API call failed:', error);
    
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data || {};
      throw new Error(errorData.message || `Server error: ${error.response.status}`);
    } else if (error.request) {
      // Network error
      throw new Error('Network error. Please check your connection.');
    } else {
      // Other errors (including JSON parse errors)
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};

export const verbfyTalkAPI = {
  // Get all rooms with filters
  getRooms: async (filters: RoomFilters): Promise<RoomsResponse> => {
    return handleApiResponse(api.get('/api/verbfy-talk', { params: filters }));
  },

  // Get a specific room
  getRoom: async (roomId: string): Promise<RoomResponse> => {
    return handleApiResponse(api.get(`/api/verbfy-talk/${roomId}`));
  },

  // Create a new room
  createRoom: async (roomData: CreateRoomData): Promise<RoomResponse> => {
    return handleApiResponse(api.post('/api/verbfy-talk', roomData));
  },

  // Join a room
  joinRoom: async (roomId: string, password?: string): Promise<unknown> => {
    return handleApiResponse(api.post(`/api/verbfy-talk/${roomId}/join`, { password }));
  },

  // Leave a room
  leaveRoom: async (roomId: string): Promise<unknown> => {
    return handleApiResponse(api.post(`/api/verbfy-talk/${roomId}/leave`));
  },

  // Get room messages
  getMessages: async (roomId: string, page = 1, limit = 50): Promise<VerbfyTalkMessage[]> => {
    return handleApiResponse(api.get(`/api/verbfy-talk/${roomId}/messages`, {
      params: { page, limit }
    }));
  },

  // Send a message
  sendMessage: async (roomId: string, content: string) => {
    return handleApiResponse(api.post(`/api/verbfy-talk/${roomId}/messages`, { content }));
  },

  // Get room participants
  getParticipants: async (roomId: string): Promise<VerbfyTalkParticipant[]> => {
    return handleApiResponse(api.get(`/api/verbfy-talk/${roomId}/participants`));
  },

  // Update participant status (mute/unmute)
  updateParticipantStatus: async (roomId: string, isMuted: boolean): Promise<unknown> => {
    return handleApiResponse(api.patch(`/api/verbfy-talk/${roomId}/participant-status`, {
      isMuted
    }));
  },

  // Get room statistics
  getStats: async (): Promise<VerbfyTalkStats> => {
    return handleApiResponse(api.get('/api/verbfy-talk/stats'));
  },

  // Delete a room (only for room creator)
  deleteRoom: async (roomId: string): Promise<unknown> => {
    return handleApiResponse(api.delete(`/api/verbfy-talk/${roomId}`));
  }
};
