export interface Material {
  _id: string;
  uploaderId: {
    _id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
  };
  originalName: string;
  savedName: string;
  type: 'pdf' | 'image' | 'video' | 'document' | 'audio';
  mimeType: string;
  fileSize: number;
  tags: string[];
  role: 'teacher' | 'student' | 'admin';
  description?: string;
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  previewURL?: string;
}

export interface MaterialFilters {
  type: string;
  tags: string;
  search: string;
  isPublic: string;
  uploaderId?: string;
  page?: number;
  limit?: number;
}

export interface MaterialUploadData {
  file: File;
  tags?: string;
  description?: string;
  isPublic?: boolean;
}

export interface MaterialUpdateData {
  tags?: string;
  description?: string;
  isPublic?: boolean;
}

export interface MaterialsResponse {
  success: boolean;
  data: {
    materials: Material[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
}

export interface MaterialResponse {
  success: boolean;
  data: Material;
  message: string;
}

export interface UploadResponse {
  success: boolean;
  data: Material;
  message: string;
}

// File type configurations
export const FILE_TYPES = {
  pdf: {
    label: 'PDF Document',
    icon: '📄',
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf']
  },
  image: {
    label: 'Image',
    icon: '🖼️',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  video: {
    label: 'Video',
    icon: '🎥',
    extensions: ['.mp4', '.webm', '.ogg', '.avi'],
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi']
  },
  document: {
    label: 'Document',
    icon: '📝',
    extensions: ['.doc', '.docx', '.txt'],
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  },
  audio: {
    label: 'Audio',
    icon: '🎵',
    extensions: ['.mp3', '.wav', '.ogg'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3']
  }
} as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const getFileTypeIcon = (typeOrMimeType: Material['type'] | string): string => {
  // If it's a MIME type, determine the type from it
  if (typeOrMimeType.includes('/')) {
    if (typeOrMimeType.startsWith('image/')) return '🖼️';
    if (typeOrMimeType.startsWith('video/')) return '🎥';
    if (typeOrMimeType.startsWith('audio/')) return '🎵';
    if (typeOrMimeType === 'application/pdf') return '📄';
    return '📝';
  }
  
  // If it's a type string, use the existing logic
  return FILE_TYPES[typeOrMimeType as Material['type']]?.icon || '📄';
};

export const getFileTypeLabel = (typeOrMimeType: Material['type'] | string): string => {
  // If it's a MIME type, determine the type from it
  if (typeOrMimeType.includes('/')) {
    if (typeOrMimeType.startsWith('image/')) return 'Image';
    if (typeOrMimeType.startsWith('video/')) return 'Video';
    if (typeOrMimeType.startsWith('audio/')) return 'Audio';
    if (typeOrMimeType === 'application/pdf') return 'PDF Document';
    return 'Document';
  }
  
  // If it's a type string, use the existing logic
  return FILE_TYPES[typeOrMimeType as Material['type']]?.label || 'File';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}; 