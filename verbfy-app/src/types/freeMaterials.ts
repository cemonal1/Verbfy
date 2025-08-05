export interface FreeMaterial {
  _id: string;
  title: string;
  description: string;
  type: 'pdf' | 'image' | 'video' | 'audio' | 'document' | 'presentation' | 'worksheet' | 'quiz';
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  category: 'Grammar' | 'Vocabulary' | 'Speaking' | 'Listening' | 'Reading' | 'Writing' | 'Pronunciation' | 'Business' | 'Travel' | 'Academic' | 'General';
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  tags: string[];
  downloadCount: number;
  rating: number;
  ratingCount: number;
  averageRating?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  previewURL?: string;
  downloadURL?: string;
}

export interface MaterialFilters {
  category?: string;
  level?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  featured?: boolean;
}

export interface UploadMaterialData {
  title: string;
  description: string;
  category: string;
  level: string;
  tags?: string;
  isFeatured?: boolean;
  file: File;
}

export interface MaterialResponse {
  success: boolean;
  data: FreeMaterial;
  message?: string;
}

export interface MaterialsResponse {
  success: boolean;
  data: FreeMaterial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RatingData {
  rating: number;
} 