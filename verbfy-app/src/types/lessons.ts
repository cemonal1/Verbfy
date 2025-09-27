// Student Lesson Types
export interface Lesson {
  _id: string;
  title?: string;
  topic: string;
  description?: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'in-progress';
  scheduledAt: string;
  duration?: number; // in minutes
  level?: 'beginner' | 'intermediate' | 'advanced';
  teacher?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  student: {
    _id: string;
    name: string;
    email: string;
  };
  lessonType?: 'one-on-one' | 'group' | 'assessment';
  materials?: {
    _id: string;
    title: string;
    type: 'document' | 'video' | 'audio' | 'link';
    url?: string;
    fileUrl?: string;
  }[];
  notes?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonFilters {
  status?: string;
  level?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface LessonResponse {
  success: boolean;
  data: Lesson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LessonDetails extends Lesson {
  meetingLink?: string;
  meetingPassword?: string;
  agenda?: string[];
  objectives?: string[];
  homework?: string;
  nextLesson?: {
    _id: string;
    scheduledAt: string;
    topic: string;
  };
}

export interface CreateLessonRequest {
  topic: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  teacherId: string;
  lessonType?: 'one-on-one' | 'group';
  materials?: string[];
  notes?: string;
}

export interface UpdateLessonRequest {
  topic?: string;
  description?: string;
  scheduledAt?: string;
  duration?: number;
  status?: string;
  notes?: string;
  materials?: string[];
}
