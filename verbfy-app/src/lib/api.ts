import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { RoomFilters, RoomsResponse, CreateRoomData, RoomResponse, JoinRoomData } from '@/types/verbfyTalk';
import { MaterialFilters, MaterialsResponse, FreeMaterial, UploadMaterialData } from '@/types/freeMaterials';
import { LessonFilters, LessonResponse, StartLessonResponse, SubmitLessonRequest, SubmitLessonResponse, LessonStats, VerbfyLesson } from '@/types/verbfyLessons';
import { TestFilters, TestResponse, StartTestResponse, SubmitTestRequest, SubmitTestResponse, PlacementRecommendation, TestStats, CEFRTest, TestAttempt } from '@/types/cefrTests';
import { PersonalizedCurriculum, CreateCurriculumRequest, UpdateProgressRequest, UpdateStudyScheduleRequest, CurriculumAnalytics, CurriculumRecommendation } from '@/types/personalizedCurriculum';
import { AchievementsData } from '@/types/achievements';
import { StudyGroupsData, CreateStudyGroupData, StudyGroupFilters } from '@/types/studyGroups';
import { AILearningSession, CreateAISessionData, AIResponseData, AIResponse, SessionProgressData, AISessionsResponse, Recommendation, GenerateRecommendationsData, AISessionAnalytics, AISessionAnalyticsFilters } from '@/types/aiLearning';
import { AdaptivePath, CreateAdaptivePathData, UpdateModuleProgressData, AdaptivePathFilters, AdaptivePathResponse, AdaptivePathsResponse, AdaptivePathAnalytics, AdaptiveRecommendation } from '@/types/adaptiveLearning';
import { TeacherAnalytics, GenerateAnalyticsData, StudentPerformanceData, LessonAnalyticsData, EngagementMetricsData, AnalyticsFilters, TeacherAnalyticsResponse, StudentPerformanceResponse, LessonAnalyticsResponse, EngagementMetricsResponse } from '@/types/teacherAnalytics';
import { AITutoringSession, AITutoringMessage, AIContentGeneration, AIContentGenerationRequest, AIContentGenerationResponse, AIAnalytics, AIUserProgress, AIRecommendation, AISessionFilters, AIContentFilters, AIAnalyticsFilters, AISessionResponse, AIContentResponse, AIAnalyticsResponse } from '@/types/aiFeatures';
import { tokenStorage } from '../utils/secureStorage';

// Create axios instance with fallback for test environment
let api: any;
try {
  // Build base URL so that all calls hit /api/*
  // If NEXT_PUBLIC_API_BASE_URL is not set (Cloudflare Pages), use same-origin and rely on _redirects
  // Otherwise allow pointing directly to backend like https://api.verbfy.com
  api = (axios as any).create?.({
    baseURL: (() => {
      const raw = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const trimmed = raw.replace(/\/$/, '');
      
      // Check if we're in production (verbfy.com domain)
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'verbfy.com' || hostname === 'www.verbfy.com') {
          return 'https://api.verbfy.com';
        }
      }
      
      // If no env is provided, default to production API domain
      if (!trimmed) return 'https://api.verbfy.com';
      return trimmed;
    })(),
    timeout: 30000,
    withCredentials: true,
    headers: { 
      'Content-Type': 'application/json'
    },
  });
} catch {
  api = undefined;
}
if (!api || !api.get || !api.post) {
  api = axios as any;
}

// Add CORS test function
export const corsTestAPI = {
  testCORS: () => {
    return api.get('/api/cors-test');
  }
};

// Request interceptor to add auth token
if ((api as any)?.interceptors?.request) {
  api.interceptors.request.use(
    (config: any) => {
      const token = tokenStorage.getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      try {
        const isWrite = ['post', 'put', 'patch', 'delete'].includes((config.method || 'get').toLowerCase());
        if (isWrite && typeof document !== 'undefined') {
          const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
          const csrf = match ? decodeURIComponent(match[1]) : undefined;
          if (csrf) {
            (config.headers as any)['X-CSRF-Token'] = csrf;
          }
          (config.headers as any)['Idempotency-Key'] = uuidv4();
        }
      } catch {}
      return config;
    },
    (error: any) => Promise.reject(error)
  );
}

// Response interceptor for error handling
if ((api as any)?.interceptors?.response) {
  api.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      if (error.response?.status === 401) {
        tokenStorage.clear();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      if (!error.response) {
        console.error('Network error:', error.message);
      }
      return Promise.reject(error);
    }
  );
}

// API helper functions
export const materialsAPI = {
  // Get all materials with filters
  getMaterials: (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, (value as any).toString());
    });
    return api.get(`/api/materials?${params.toString()}`).then((r: any) => r.data);
  },

  // Get material by ID
  getMaterial: (id: string) => {
    return api.get(`/api/materials/${id}`).then((r: any) => r.data);
  },

  // Upload material
  uploadMaterial: (formData: FormData) => {
    return api.post('/api/materials/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then((r: any) => r.data);
  },

  // Update material
  updateMaterial: (id: string, data: any) => {
    return api.put(`/api/materials/${id}`, data).then((r: any) => r.data);
  },

  // Delete material
  deleteMaterial: (id: string) => {
    return api.delete(`/api/materials/${id}`).then((r: any) => r.data);
  },

  // Preview material
  previewMaterial: (id: string) => {
    return api.get(`/api/materials/${id}/preview`).then((r: any) => r.data);
  },

  // Download material
  downloadMaterial: (id: string) => {
    return api.get(`/api/materials/${id}/download`, { responseType: 'blob' }).then((r: any) => r.data);
  },
};

export const authAPI = {
  // Login
  login: (credentials: { email: string; password: string }) => {
    return api.post('/api/auth/login', credentials).then((r: any) => r.data);
  },

  // Register
  register: (userData: { name: string; email: string; password: string; role: string }) => {
    return api.post('/api/auth/register', userData).then((r: any) => r.data);
  },

  // Logout
  logout: () => {
    return api.post('/api/auth/logout').then((r: any) => r.data);
  },

  // Get current user
  getCurrentUser: () => {
    return api.get('/api/auth/me');
  },

  // Refresh token
  refreshToken: () => {
    return api.post('/api/auth/refresh').then((r: any) => r.data);
  },
};

export const userAPI = {
  // Get user profile
  getProfile: () => {
    return api.get('/api/users/profile').then((r: any) => r.data);
  },

  // Update user profile
  updateProfile: (data: any) => {
    return api.put('/api/users/profile', data).then((r: any) => r.data);
  },

  // Upload avatar
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/api/users/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r: any) => r.data);
  },

  // Get S3 presigned upload URL
  getPresignedUploadUrl: (key: string, contentType: string) => {
    return api.get(`/api/users/uploads/presign`, { params: { key, contentType } }).then((r: any) => r.data);
  },
};

export const reservationAPI = {
  // Get reservations
  getReservations: (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    return api.get(`/api/reservations?${params.toString()}`);
  },

  // Create reservation
  createReservation: (data: any) => {
    return api.post('/api/reservations', data);
  },

  // Update reservation
  updateReservation: (id: string, data: any) => {
    return api.put(`/api/reservations/${id}`, data);
  },

  // Delete reservation
  deleteReservation: (id: string) => {
    return api.delete(`/api/reservations/${id}`);
  },
};

export const availabilityAPI = {
  // Get availability
  getAvailability: (teacherId: string) => {
    return api.get(`/api/availability/${teacherId}`);
  },

  // Set availability
  setAvailability: (data: any) => {
    return api.post('/api/availability', data);
  },

  // Update availability
  updateAvailability: (id: string, data: any) => {
    return api.put(`/api/availability/${id}`, data);
  },

  // Delete availability
  deleteAvailability: (id: string) => {
    return api.delete(`/api/availability/${id}`);
  },
};

export const notificationAPI = {
  // Get notifications
  getNotifications: () => {
    return api.get('/api/notifications');
  },

  // Mark notification as read
  markAsRead: (id: string) => {
    return api.patch(`/api/notifications/${id}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    return api.patch('/api/notifications/read-all');
  },
};

export const messagesAPI = {
  // Get conversations
  getConversations: () => {
    return api.get('/api/messages/conversations');
  },

  // Get messages for conversation
  getMessages: (conversationId: string) => {
    return api.get(`/api/messages/conversations/${conversationId}`);
  },

  // Send message
  sendMessage: (conversationId: string, data: { content: string; type?: string }) => {
    return api.post(`/api/messages/conversations/${conversationId}`, data);
  },

  // Create conversation
  createConversation: (data: { participantId: string; initialMessage?: string }) => {
    return api.post('/api/messages/conversations', data);
  },

  // Mark messages as read
  markAsRead: (conversationId: string) => {
    return api.patch(`/api/messages/conversations/${conversationId}/read`);
  },
};

export const analyticsAPI = {
  // Get teacher analytics
  getTeacherAnalytics: () => {
    return api.get('/api/analytics/teacher');
  },

  // Get student analytics
  getStudentAnalytics: () => {
    return api.get('/api/analytics/student');
  },

  // Get admin analytics
  getAdminAnalytics: () => {
    return api.get('/api/analytics/admin');
  },

  // Get earnings report
  getEarningsReport: (period = 'month', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ period });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/api/analytics/earnings?${params.toString()}`);
  },

  // Get progress report
  getProgressReport: (skill?: string, period = 'month') => {
    const params = new URLSearchParams({ period });
    if (skill) params.append('skill', skill);
    return api.get(`/api/analytics/progress?${params.toString()}`);
  },
};

export const paymentAPI = {
  // Create checkout session
  createCheckoutSession: (data: { productId: string; couponCode?: string }) => {
    return api.post('/api/payments/create-session', data);
  },

  // Get payment history
  getPaymentHistory: (params?: any) => {
    return api.get('/api/payments/history', { params });
  },

  // Get available products
  getProducts: (params?: any) => {
    return api.get('/api/payments/products', { params });
  },

  // Get payment statistics
  getPaymentStats: () => {
    return api.get('/api/payments/stats');
  },

  // Refund payment (admin only)
  refundPayment: (paymentId: string, data: { reason?: string }) => {
    return api.post(`/api/payments/${paymentId}/refund`, data);
  },
};

export const adminAPI = {
  // Overview & Analytics
  getOverview: () => {
    return api.get('/api/admin/overview');
  },

  // Get admin stats (legacy)
  getStats: () => {
    return api.get('/api/admin/stats');
  },

  // Get recent activities (legacy)
  getActivities: () => {
    return api.get('/api/admin/activities');
  },

  // User Management
  getUsers: (params?: any) => {
    return api.get('/api/admin/users', { params });
  },

  getUserById: (id: string) => {
    return api.get(`/api/admin/users/${id}`);
  },

  updateUserRole: (id: string, role: string) => {
    return api.patch(`/api/admin/users/${id}/role`, { role });
  },

  updateUserStatus: (userId: string, status: string) => {
    return api.patch(`/api/admin/users/${userId}/status`, { status });
  },

  deleteUser: (id: string) => {
    return api.delete(`/api/admin/users/${id}`);
  },

  // Material Moderation
  getMaterials: (params?: any) => {
    return api.get('/api/admin/materials', { params });
  },

  approveMaterial: (id: string, data: { approved: boolean; reason?: string }) => {
    return api.patch(`/api/admin/materials/${id}/approve`, data);
  },

  deleteMaterial: (id: string) => {
    return api.delete(`/api/admin/materials/${id}`);
  },

  // Payment Management
  getPayments: (params?: any) => {
    return api.get('/api/admin/payments', { params });
  },

  refundPayment: (id: string, data: { reason?: string }) => {
    return api.patch(`/api/admin/payments/${id}/refund`, data);
  },

  // Logs & Activity
  getLogs: (params?: any) => {
    return api.get('/api/admin/logs', { params });
  },
};

// VerbfyTalk API functions
export const verbfyTalkAPI = {
  // Get all available rooms
  getRooms: async (filters?: RoomFilters): Promise<RoomsResponse> => {
    const params = new URLSearchParams();
    if (filters?.level) params.append('level', filters.level);
    if (filters?.isPrivate !== undefined) params.append('isPrivate', filters.isPrivate.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/api/verbfy-talk?${params.toString()}`);
    return response.data;
  },

  // Get user's rooms
  getUserRooms: async (page = 1, limit = 10): Promise<RoomsResponse> => {
    const response = await api.get(`/api/verbfy-talk/my-rooms?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Create a new room
  createRoom: async (roomData: CreateRoomData): Promise<RoomResponse> => {
    const response = await api.post('/api/verbfy-talk', roomData);
    return response.data;
  },

  // Get room details
  getRoomDetails: async (roomId: string): Promise<RoomResponse> => {
    const response = await api.get(`/api/verbfy-talk/${roomId}`);
    return response.data;
  },

  // Join a room
  joinRoom: async (roomId: string, joinData?: JoinRoomData): Promise<RoomResponse> => {
    const response = await api.post(`/api/verbfy-talk/${roomId}/join`, joinData || {});
    return response.data;
  },

  // Leave a room
  leaveRoom: async (roomId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/verbfy-talk/${roomId}/leave`);
    return response.data;
  },

  // Update room
  updateRoom: async (roomId: string, roomData: Partial<CreateRoomData>): Promise<RoomResponse> => {
    const response = await api.put(`/api/verbfy-talk/${roomId}`, roomData);
    return response.data;
  },

  // Delete room
  deleteRoom: async (roomId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/verbfy-talk/${roomId}`);
    return response.data;
  }
};

// Free Materials API functions
export const freeMaterialsAPI = {
  // Get all materials
  getMaterials: async (filters?: MaterialFilters): Promise<MaterialsResponse> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.level) params.append('level', filters.level);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.featured) params.append('featured', filters.featured.toString());

    const response = await api.get(`/api/free-materials?${params.toString()}`);
    return response.data;
  },

  // Get featured materials
  getFeaturedMaterials: async (): Promise<{ success: boolean; data: FreeMaterial[] }> => {
    const response = await api.get('/api/free-materials/featured');
    return response.data;
  },

  // Get material categories
  getCategories: async (): Promise<{ success: boolean; data: string[] }> => {
    const response = await api.get('/api/free-materials/categories');
    return response.data;
  },

  // Get material levels
  getLevels: async (): Promise<{ success: boolean; data: string[] }> => {
    const response = await api.get('/api/free-materials/levels');
    return response.data;
  },

  // Get material by ID
  getMaterial: async (id: string): Promise<{ success: boolean; data: FreeMaterial }> => {
    const response = await api.get(`/api/free-materials/${id}`);
    return response.data;
  },

  // Upload material
  uploadMaterial: async (materialData: UploadMaterialData): Promise<{ success: boolean; data: FreeMaterial }> => {
    const formData = new FormData();
    formData.append('title', materialData.title);
    formData.append('description', materialData.description);
    formData.append('category', materialData.category);
    formData.append('level', materialData.level);
    if (materialData.tags) formData.append('tags', materialData.tags);
    if (materialData.isFeatured) formData.append('isFeatured', materialData.isFeatured.toString());
    formData.append('file', materialData.file);

    const response = await api.post('/api/free-materials', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Rate material
  rateMaterial: async (id: string, rating: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/free-materials/${id}/rate`, { rating });
    return response.data;
  },

  // Update material
  updateMaterial: async (id: string, materialData: Partial<UploadMaterialData>): Promise<{ success: boolean; data: FreeMaterial }> => {
    const response = await api.put(`/api/free-materials/${id}`, materialData);
    return response.data;
  },

  // Delete material
  deleteMaterial: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/free-materials/${id}`);
    return response.data;
  },

  // Download material
  downloadMaterial: async (id: string): Promise<Blob> => {
    const response = await api.get(`/api/free-materials/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// Student Lessons API
export const lessonAPI = {
  // Get student's lessons
  getStudentLessons: async (filters?: any): Promise<any> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value && value !== 'all') params.append(key, value.toString());
    });
    const response = await api.get(`/api/lessons/student?${params.toString()}`);
    return response.data;
  },

  // Get lesson details
  getLesson: async (id: string): Promise<any> => {
    const response = await api.get(`/api/lessons/${id}`);
    return response.data;
  },

  // Join lesson
  joinLesson: async (lessonId: string): Promise<any> => {
    const response = await api.post(`/api/lessons/${lessonId}/join`);
    return response.data;
  },

  // Leave lesson
  leaveLesson: async (lessonId: string): Promise<any> => {
    const response = await api.post(`/api/lessons/${lessonId}/leave`);
    return response.data;
  }
};

// Verbfy Lessons API
export const verbfyLessonsAPI = {
  // Get all lessons with filters
  getLessons: async (filters?: any): Promise<any> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/api/verbfy-lessons?${params.toString()}`);
    return response.data;
  },

  // Get lesson by ID
  getLesson: async (id: string): Promise<any> => {
    const response = await api.get(`/api/verbfy-lessons/${id}`);
    return response.data;
  },

  // Create lesson (admin/teacher only)
  createLesson: async (data: any): Promise<any> => {
    const response = await api.post('/api/verbfy-lessons', data);
    return response.data;
  },

  // Update lesson (admin/teacher only)
  updateLesson: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/api/verbfy-lessons/${id}`, data);
    return response.data;
  },

  // Delete lesson (admin/teacher only)
  deleteLesson: async (id: string): Promise<any> => {
    const response = await api.delete(`/api/verbfy-lessons/${id}`);
    return response.data;
  },

  // Start lesson attempt
  startLesson: async (lessonId: string): Promise<any> => {
    const response = await api.post(`/api/verbfy-lessons/${lessonId}/start`);
    return response.data;
  },

  // Submit lesson attempt
  submitLesson: async (attemptId: string, data: any): Promise<any> => {
    const response = await api.post(`/api/verbfy-lessons/attempt/${attemptId}/submit`, data);
    return response.data;
  },

  // Get lesson categories
  getCategories: async (): Promise<any> => {
    const response = await api.get('/api/verbfy-lessons/categories');
    return response.data;
  },

  // Get lesson statistics
  getStats: async (lessonId: string): Promise<any> => {
    const response = await api.get(`/api/verbfy-lessons/${lessonId}/stats`);
    return response.data;
  },
};

// CEFR Tests API
export const cefrTestsAPI = {
  // Get all tests with filters
  getTests: async (filters: any = {}): Promise<TestResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.append(key, value.toString());
    });
    const response = await api.get(`/api/cefr-tests?${params.toString()}`);
    return response.data;
  },

  // Get test by ID
  getTest: async (testId: string): Promise<CEFRTest> => {
    const response = await api.get(`/api/cefr-tests/${testId}`);
    return response.data;
  },

  // Start test
  startTest: async (testId: string): Promise<StartTestResponse> => {
    const response = await api.post(`/api/cefr-tests/${testId}/start`);
    return response.data;
  },

  // Submit test
  submitTest: async (attemptId: string, data: SubmitTestRequest): Promise<SubmitTestResponse> => {
    const response = await api.post(`/api/cefr-tests/attempt/${attemptId}/submit`, data);
    return response.data;
  },

  // Get test attempt details (may not be available on all backends)
  getTestAttempt: async (attemptId: string): Promise<TestAttempt> => {
    const response = await api.get(`/api/cefr-tests/attempt/${attemptId}`);
    return response.data;
  },

  // Get test statistics
  getTestStats: async (testId: string): Promise<TestStats> => {
    const response = await api.get(`/api/cefr-tests/${testId}/stats`);
    return response.data;
  },

  // Get placement recommendation
  getPlacementRecommendation: async (): Promise<PlacementRecommendation> => {
    const response = await api.get('/api/cefr-tests/placement/recommendation');
    return response.data;
  },

  // Seed 50Q Global Placement (admin only)
  seedGlobalPlacement: async () => {
    const response = await api.post('/api/cefr-tests/seed/global-placement');
    return response.data;
  },
  // Seed Kids A1–B1 (admin only)
  seedKidsA1B1: async () => {
    const response = await api.post('/api/cefr-tests/seed/kids-a1-b1');
    return response.data;
  },
  // Seed Adults A1–B2 (admin only)
  seedAdultsA1B2: async () => {
    const response = await api.post('/api/cefr-tests/seed/adults-a1-b2');
    return response.data;
  },
  // Seed Advanced B1–C2 (admin only)
  seedAdvancedB1C2: async () => {
    return api.post('/api/cefr-tests/seed/advanced-b1-c2');
  },
};

// Personalized Curriculum API
export const personalizedCurriculumAPI = {
  // Create curriculum
  createCurriculum: async (data: CreateCurriculumRequest): Promise<{ curriculum: PersonalizedCurriculum }> => {
    const response = await api.post('/api/personalized-curriculum', data);
    return response.data;
  },

  // Get user's curriculum
  getCurriculum: async (): Promise<PersonalizedCurriculum> => {
    const response = await api.get('/api/personalized-curriculum');
    return response.data;
  },

  // Update curriculum progress
  updateProgress: async (data: UpdateProgressRequest): Promise<{ message: string }> => {
    const response = await api.put('/api/personalized-curriculum/progress', data);
    return response.data;
  },

  // Update study schedule
  updateStudySchedule: async (data: UpdateStudyScheduleRequest): Promise<{ message: string }> => {
    const response = await api.put('/api/personalized-curriculum/schedule', data);
    return response.data;
  },

  // Get curriculum analytics
  getAnalytics: async (): Promise<{ analytics: CurriculumAnalytics }> => {
    const response = await api.get('/api/personalized-curriculum/analytics');
    return response.data;
  },

  // Get recommendations
  getRecommendations: async (): Promise<{ recommendations: CurriculumRecommendation[] }> => {
    const response = await api.get('/api/personalized-curriculum/recommendations');
    return response.data;
  },

  // Complete recommendation
  completeRecommendation: async (recommendationId: string): Promise<{ message: string }> => {
    const response = await api.post(`/api/personalized-curriculum/recommendations/${recommendationId}/complete`);
    return response.data;
  },

  // Get study schedule
  getStudySchedule: async (): Promise<any> => {
    const response = await api.get('/api/personalized-curriculum/schedule');
    return response.data;
  },

  // Add study session
  addStudySession: async (data: any): Promise<any> => {
    const response = await api.post('/api/personalized-curriculum/schedule/sessions', data);
    return response.data;
  },

  // Complete study session
  completeStudySession: async (sessionId: number): Promise<any> => {
    const response = await api.post(`/api/personalized-curriculum/schedule/sessions/${sessionId}/complete`);
    return response.data;
  },
};

// Function to set API access token (for backward compatibility)
export const setApiAccessToken = (token: string) => {
  localStorage.setItem('verbfy_token', token);
};

// Achievements API
export const achievementsAPI = {
  // Get user achievements
  getAchievements: async (): Promise<any> => {
    const response = await api.get('/api/achievements');
    return response.data;
  },

  // Get achievement progress
  getProgress: async (achievementId: number): Promise<any> => {
    const response = await api.get(`/api/achievements/${achievementId}/progress`);
    return response.data;
  },

  // Get leaderboard
  getLeaderboard: async (): Promise<any> => {
    const response = await api.get('/api/achievements/leaderboard');
    return response.data;
  },

  // Unlock achievement
  unlockAchievement: async (achievementId: number): Promise<any> => {
    const response = await api.post(`/api/achievements/${achievementId}/unlock`);
    return response.data;
  },
};

// Games API
export const gamesAPI = {
  list: async (params?: any) => {
    return api.get('/api/games', { params });
  },
  create: async (data: { title: string; description?: string; category?: string; level?: string; thumbnailUrl?: string; gameUrl: string }) => {
    return api.post('/api/games', data);
  },
  delete: async (id: string) => {
    return api.delete(`/api/games/${id}`);
  },
};

// Study Groups API
export const studyGroupsAPI = {
  // Get user's study groups
  getMyGroups: async (): Promise<any> => {
    const response = await api.get('/api/study-groups/my');
    return response.data;
  },

  // Get discoverable groups
  getDiscoverGroups: async (filters?: any): Promise<any> => {
    const response = await api.get('/api/study-groups/discover', { params: filters });
    return response.data;
  },

  // Create study group
  createGroup: async (data: any): Promise<any> => {
    const response = await api.post('/api/study-groups', data);
    return response.data;
  },

  // Join study group
  joinGroup: async (groupId: number, password?: string): Promise<any> => {
    const response = await api.post(`/api/study-groups/${groupId}/join`, { password });
    return response.data;
  },

  // Leave study group
  leaveGroup: async (groupId: number): Promise<any> => {
    const response = await api.post(`/api/study-groups/${groupId}/leave`);
    return response.data;
  },

  // Get group details
  getGroupDetails: async (groupId: number): Promise<any> => {
    const response = await api.get(`/api/study-groups/${groupId}`);
    return response.data;
  },

  // Send message to group
  sendMessage: async (groupId: number, message: string): Promise<any> => {
    const response = await api.post(`/api/study-groups/${groupId}/messages`, { message });
    return response.data;
  },

  // Get group messages
  getMessages: async (groupId: number): Promise<any> => {
    const response = await api.get(`/api/study-groups/${groupId}/messages`);
    return response.data;
  },
};

// AI Learning API
export const aiLearningAPI = {
  // Create AI learning session
  createSession: async (data: CreateAISessionData): Promise<{ session: AILearningSession }> => {
    const response = await api.post('/api/ai-learning/sessions', data);
    return response.data;
  },

  // Get AI response
  getAIResponse: async (data: AIResponseData): Promise<AIResponse> => {
    const response = await api.post('/api/ai-learning/response', data);
    return response.data;
  },

  // Get user sessions
  getSessions: async (filters?: AISessionFilters): Promise<AISessionsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/api/ai-learning/sessions?${params.toString()}`);
    return response.data;
  },

  // Update session progress
  updateSessionProgress: async (sessionId: string, data: SessionProgressData): Promise<{ message: string }> => {
    const response = await api.put(`/api/ai-learning/sessions/${sessionId}/progress`, data);
    return response.data;
  },

  // Generate recommendations
  generateRecommendations: async (data: GenerateRecommendationsData): Promise<{ recommendations: Recommendation[] }> => {
    const response = await api.post('/api/ai-learning/recommendations', data);
    return response.data;
  },

  // Get session analytics
  getSessionAnalytics: async (filters?: AISessionAnalyticsFilters): Promise<{ analytics: AISessionAnalytics }> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/api/ai-learning/sessions/analytics?${params.toString()}`);
    return response.data;
  },
};

// Adaptive Learning API
export const adaptiveLearningAPI = {
  // Create adaptive path
  createPath: async (data: CreateAdaptivePathData): Promise<AdaptivePathResponse> => {
    const response = await api.post('/api/adaptive-learning/paths', data);
    return response.data;
  },

  // Get user's adaptive paths
  getPaths: async (filters?: AdaptivePathFilters): Promise<AdaptivePathsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/api/adaptive-learning/paths?${params.toString()}`);
    return response.data;
  },

  // Get adaptive path by ID
  getPath: async (pathId: string): Promise<AdaptivePathResponse> => {
    const response = await api.get(`/api/adaptive-learning/paths/${pathId}`);
    return response.data;
  },

  // Update module progress
  updateModuleProgress: async (data: UpdateModuleProgressData): Promise<{ message: string }> => {
    const response = await api.put('/api/adaptive-learning/paths/progress', data);
    return response.data;
  },

  // Get adaptive recommendations
  getRecommendations: async (pathId: string): Promise<{ recommendations: AdaptiveRecommendation[] }> => {
    const response = await api.get(`/api/adaptive-learning/paths/${pathId}/recommendations`);
    return response.data;
  },

  // Get path analytics
  getPathAnalytics: async (pathId: string): Promise<{ analytics: AdaptivePathAnalytics }> => {
    const response = await api.get(`/api/adaptive-learning/paths/${pathId}/analytics`);
    return response.data;
  },
};

// Teacher Analytics API
export const teacherAnalyticsAPI = {
  // Generate analytics
  generateAnalytics: async (data: GenerateAnalyticsData): Promise<TeacherAnalyticsResponse> => {
    const response = await api.post('/api/teacher-analytics/generate', data);
    return response.data;
  },

  // Get teacher analytics
  getAnalytics: async (filters?: AnalyticsFilters): Promise<TeacherAnalyticsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/api/teacher-analytics?${params.toString()}`);
    return response.data;
  },

  // Get student performance
  getStudentPerformance: async (filters?: AnalyticsFilters): Promise<StudentPerformanceResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/api/teacher-analytics/student-performance?${params.toString()}`);
    return response.data;
  },

  // Get lesson analytics
  getLessonAnalytics: async (filters?: AnalyticsFilters): Promise<LessonAnalyticsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/api/teacher-analytics/lesson-analytics?${params.toString()}`);
    return response.data;
  },

  // Get engagement metrics
  getEngagementMetrics: async (filters?: AnalyticsFilters): Promise<EngagementMetricsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/api/teacher-analytics/engagement?${params.toString()}`);
    return response.data;
  },
};

// AI Features API
export const aiFeaturesAPI = {
  // AI Tutoring Sessions
  startTutoringSession: async (data: { sessionType: string; cefrLevel: string }): Promise<AITutoringSession> => {
    const response = await api.post('/api/ai-features/tutoring/sessions', data);
    return response.data;
  },

  sendTutoringMessage: async (sessionId: string, data: { content: string; messageType: string }): Promise<{ message: AITutoringMessage; session?: AITutoringSession }> => {
    const response = await api.post(`/api/ai-features/tutoring/sessions/${sessionId}/messages`, data);
    return response.data;
  },

  endTutoringSession: async (sessionId: string): Promise<AITutoringSession> => {
    const response = await api.put(`/api/ai-features/tutoring/sessions/${sessionId}/end`);
    return response.data;
  },

  getTutoringSessions: async (filters?: AISessionFilters): Promise<AISessionResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/api/ai-features/tutoring/sessions?${params.toString()}`);
    return response.data;
  },

  getTutoringSession: async (sessionId: string): Promise<AITutoringSession> => {
    const response = await api.get(`/api/ai-features/tutoring/sessions/${sessionId}`);
    return response.data;
  },

  // AI Content Generation
  generateContent: async (data: AIContentGenerationRequest): Promise<AIContentGenerationResponse> => {
    const response = await api.post('/api/ai-features/content/generate', data);
    return response.data;
  },

  getGeneratedContent: async (filters?: AIContentFilters): Promise<AIContentResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/api/ai-features/content?${params.toString()}`);
    return response.data;
  },

  getContent: async (contentId: string): Promise<AIContentGeneration> => {
    const response = await api.get(`/api/ai-features/content/${contentId}`);
    return response.data;
  },

  reviewContent: async (contentId: string, data: { status: string; notes?: string }): Promise<{ message: string }> => {
    const response = await api.put(`/api/ai-features/content/${contentId}/review`, data);
    return response.data;
  },

  updateContent: async (contentId: string, data: Partial<AIContentGeneration>): Promise<AIContentGeneration> => {
    const response = await api.put(`/api/ai-features/content/${contentId}`, data);
    return response.data;
  },

  deleteContent: async (contentId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/ai-features/content/${contentId}`);
    return response.data;
  },

  // AI Analytics
  getAnalytics: async (filters?: AIAnalyticsFilters): Promise<{ analytics: AIAnalytics }> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/api/ai-features/analytics?${params.toString()}`);
    return response.data;
  },

  getUserProgress: async (filters?: AIAnalyticsFilters): Promise<AIUserProgress> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/api/ai-features/user-progress?${params.toString()}`);
    return response.data;
  },

  // AI Recommendations
  getRecommendations: async (): Promise<{ recommendations: AIRecommendation[] }> => {
    const response = await api.get('/api/ai-features/recommendations');
    return response.data;
  },

  completeRecommendation: async (recommendationId: string): Promise<{ message: string }> => {
    const response = await api.post(`/api/ai-features/recommendations/${recommendationId}/complete`);
    return response.data;
  },

  // AI Model Management
  getModelInfo: async (): Promise<{ model: string; version: string; status: string }> => {
    const response = await api.get('/api/ai-features/model-info');
    return response.data;
  },

  updateModelSettings: async (data: { model: string; settings: any }): Promise<{ message: string }> => {
    const response = await api.put('/api/ai-features/model-settings', data);
    return response.data;
  },
};

export default api; 