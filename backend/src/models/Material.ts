import mongoose, { Document, Schema } from 'mongoose';

export interface IMaterial extends Document {
  uploaderId: mongoose.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>({
  uploaderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  savedName: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['pdf', 'image', 'video', 'document', 'audio'],
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  role: {
    type: String,
    enum: ['teacher', 'student', 'admin'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
MaterialSchema.index({ uploaderId: 1 });
MaterialSchema.index({ type: 1 });
MaterialSchema.index({ tags: 1 });
MaterialSchema.index({ isPublic: 1 });
MaterialSchema.index({ createdAt: -1 });
MaterialSchema.index({ role: 1 });

// Compound indexes for frequent query patterns
MaterialSchema.index({ isPublic: 1, type: 1 }); // Public materials by type
MaterialSchema.index({ uploaderId: 1, type: 1 }); // User's materials by type
MaterialSchema.index({ role: 1, isPublic: 1 }); // Materials by role and visibility

// Text indexes for search functionality
MaterialSchema.index({ 
  originalName: 'text', 
  description: 'text', 
  tags: 'text' 
}, { 
  weights: { 
    originalName: 10, 
    tags: 5, 
    description: 1 
  },
  name: 'material_text_search'
});

// Virtual for preview URL
MaterialSchema.virtual('previewURL').get(function() {
  return `/api/materials/${this._id}/preview`;
});

// Ensure virtuals are serialized
MaterialSchema.set('toJSON', { virtuals: true });
MaterialSchema.set('toObject', { virtuals: true });

export const Material = mongoose.model<IMaterial>('Material', MaterialSchema);