export interface VerbfyTalkRoom {
  _id: string;
  name: string;
  description: string;
  topic: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mixed';
  isPrivate: boolean;
  password?: string;
  maxParticipants: number;
  currentParticipants: number;
  isActive: boolean;
  createdBy: string; // User ID of the creator
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomData {
  name: string;
  description: string;
  topic: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mixed';
  isPrivate: boolean;
  password?: string;
  maxParticipants: number;
}

export interface RoomFilters {
  level: 'All' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Mixed';
  isPrivate: boolean;
  page: number;
  limit: number;
}

export interface RoomsResponse {
  success: boolean;
  rooms: VerbfyTalkRoom[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RoomResponse {
  success: boolean;
  room: VerbfyTalkRoom;
}

export interface JoinRoomData {
  roomId: string;
  password?: string;
}

export interface VerbfyTalkParticipant {
  id: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  joinedAt: string;
}

export interface VerbfyTalkMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'text' | 'system';
}

export interface VerbfyTalkStats {
  totalRooms: number;
  activeRooms: number;
  totalParticipants: number;
  averageSessionDuration: number;
} 