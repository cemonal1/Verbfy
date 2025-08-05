export interface VerbfyTalkRoom {
  _id: string;
  name: string;
  description: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  participants: Array<{
    userId: {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    joinedAt: string;
    isActive: boolean;
  }>;
  maxParticipants: number;
  isPrivate: boolean;
  topic?: string;
  language: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mixed';
  isActive: boolean;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  currentParticipants?: number;
  status?: 'waiting' | 'active' | 'ended';
}

export interface CreateRoomData {
  name: string;
  description: string;
  isPrivate: boolean;
  password?: string;
  topic?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mixed';
  maxParticipants: number;
}

export interface JoinRoomData {
  password?: string;
}

export interface RoomFilters {
  level?: string;
  isPrivate?: boolean;
  page?: number;
  limit?: number;
}

export interface RoomResponse {
  success: boolean;
  data: VerbfyTalkRoom;
  message?: string;
}

export interface RoomsResponse {
  success: boolean;
  data: VerbfyTalkRoom[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
} 