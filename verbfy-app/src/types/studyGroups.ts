export interface StudyGroupMember {
  id: number;
  name: string;
  avatar: string;
  role: 'owner' | 'member' | 'moderator';
  level: string;
  joinedAt: string;
}

export interface StudyGroupMessage {
  id: number;
  user: string;
  message: string;
  time: string;
  userId: number;
}

export interface StudyGroup {
  id: number;
  name: string;
  description: string;
  level: string;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  isOwner: boolean;
  lastActivity: string;
  nextSession?: string;
  members: StudyGroupMember[];
  recentMessages: StudyGroupMessage[];
  tags?: string[];
  createdAt: string;
  ownerId: number;
}

export interface StudyGroupStats {
  myGroups: number;
  totalMembers: number;
  activeSessions: number;
  groupsOwned: number;
}

export interface StudyGroupsData {
  stats: StudyGroupStats;
  myGroups: StudyGroup[];
  discoverGroups: StudyGroup[];
  recommendedGroups: StudyGroup[];
}

export interface CreateStudyGroupData {
  name: string;
  description: string;
  maxMembers: number;
  level: string;
  isPrivate: boolean;
  password?: string;
}

export interface StudyGroupFilters {
  level?: string;
  isPrivate?: boolean;
  tags?: string[];
  search?: string;
}

export interface StudyGroupSession {
  id: number;
  groupId: number;
  title: string;
  description: string;
  startTime: string;
  duration: number;
  maxParticipants: number;
  currentParticipants: number;
  isActive: boolean;
  topic?: string;
  materials?: string[];
} 