// Admin User Management Types
export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
  profilePicture?: string;
  // Teacher approval fields
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isApproved?: boolean;
  bio?: string;
  phone?: string;
}

export interface UserFilters {
  role?: 'student' | 'teacher' | 'admin';
  status?: 'active' | 'inactive' | 'suspended';
  search?: string;
}

// Admin Material Moderation Types
export interface AdminMaterial {
  _id: string;
  originalName: string;
  savedName: string;
  description?: string;
  type: 'pdf' | 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  uploaderId: {
    _id: string;
    name: string;
    email: string;
  };
  tags: string[];
  role: 'teacher' | 'student' | 'admin';
  isPublic: boolean;
  fileSize: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  // Optional fields for backward compatibility
  title?: string;
  status?: 'pending' | 'approved' | 'rejected';
  moderatedAt?: string;
  moderatedBy?: string;
  moderationNote?: string;
}

export interface MaterialFilters {
  status?: 'pending' | 'approved' | 'rejected';
  type?: 'pdf' | 'image' | 'video' | 'audio' | 'document';
  search?: string;
}

// Admin Payment Management Types
export interface AdminPayment {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  teacherId?: {
    _id: string;
    name: string;
    email: string;
  };
  // Legacy properties for backward compatibility
  teacher?: {
    _id: string;
    name: string;
    email: string;
  };
  student?: {
    _id: string;
    name: string;
    email: string;
  };
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  price?: number;
  amount?: number; // Alternative property name
  isPaid: boolean;
  createdAt: string;
  refundedAt?: string;
  refundedBy?: string;
  refundReason?: string;
  lessonType?: string;
  lessonLevel?: string;
  paymentId?: string;
  method?: string;
  transactionId?: string;
}

export interface PaymentFilters {
  userId?: string;
  status?: 'pending' | 'completed' | 'cancelled' | 'refunded';
  startDate?: string;
  endDate?: string;
}

// Admin Logs Types
export interface AdminLog {
  _id: string;
  type: 'user_activity' | 'material_upload' | 'lesson_booking' | 'payment' | 'system';
  action: string;
  user: string;
  details: string;
  createdAt: string;
  email?: string;
}

export interface LogFilters {
  type?: 'user_activity' | 'material_upload' | 'lesson_booking' | 'payment' | 'system';
  startDate?: string;
  endDate?: string;
}

// Admin Analytics Types
export interface AdminOverview {
  stats: {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalMaterials: number;
    totalReservations: number;
    totalRevenue: number;
    userGrowth: number;
    revenueGrowth: number;
  };
  recent: {
    users: AdminUser[];
    materials: AdminMaterial[];
    reservations: AdminPayment[];
  };
}

// API Response Types
export interface AdminUsersResponse {
  success: boolean;
  data: {
    users: AdminUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
}

export interface AdminMaterialsResponse {
  success: boolean;
  data: {
    materials: AdminMaterial[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
}

export interface AdminPaymentsResponse {
  success: boolean;
  data: {
    payments: AdminPayment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
}

export interface AdminLogsResponse {
  success: boolean;
  data: {
    logs: AdminLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
}

export interface AdminOverviewResponse {
  success: boolean;
  data: AdminOverview;
  message: string;
}

// Action Types
export interface UpdateUserRoleData {
  role: 'student' | 'teacher' | 'admin';
}

export interface UpdateUserStatusData {
  status: 'active' | 'inactive' | 'suspended';
}

export interface ApproveMaterialData {
  approved: boolean;
  reason?: string;
}

export interface RefundPaymentData {
  reason?: string;
}

// Utility Functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
    case 'approved':
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'inactive':
    case 'rejected':
    case 'cancelled':
      return 'text-red-600 bg-red-100';
    case 'suspended':
    case 'refunded':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'text-purple-600 bg-purple-100';
    case 'teacher':
      return 'text-blue-600 bg-blue-100';
    case 'student':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};