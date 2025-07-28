import mongoose, { Document, Schema } from 'mongoose';

export interface ILessonMaterial extends Document {
  title: string;
  description?: string;
  type: 'document' | 'video' | 'audio' | 'image' | 'presentation' | 'worksheet' | 'quiz';
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number; // in bytes
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId; // User ID
  lessonType?: 'VerbfySpeak' | 'VerbfyListen' | 'VerbfyRead' | 'VerbfyWrite' | 'VerbfyGrammar' | 'VerbfyExam';
  lessonLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  tags?: string[];
  isPublic: boolean; // Can be used by other teachers
  downloadCount: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const LessonMaterialSchema = new Schema<ILessonMaterial>({
  title: { type: String, required: true },
  description: { type: String },
  type: { 
    type: String, 
    enum: ['document', 'video', 'audio', 'image', 'presentation', 'worksheet', 'quiz'], 
    required: true 
  },
  fileUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lessonType: { 
    type: String, 
    enum: ['VerbfySpeak', 'VerbfyListen', 'VerbfyRead', 'VerbfyWrite', 'VerbfyGrammar', 'VerbfyExam'] 
  },
  lessonLevel: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'] 
  },
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: false },
  downloadCount: { type: Number, default: 0 },
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
LessonMaterialSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
LessonMaterialSchema.index({ uploadedBy: 1 });
LessonMaterialSchema.index({ lessonType: 1 });
LessonMaterialSchema.index({ lessonLevel: 1 });
LessonMaterialSchema.index({ type: 1 });
LessonMaterialSchema.index({ isPublic: 1 });
LessonMaterialSchema.index({ tags: 1 });
LessonMaterialSchema.index({ rating: -1 });
LessonMaterialSchema.index({ downloadCount: -1 });

export const LessonMaterial = mongoose.model<ILessonMaterial>('LessonMaterial', LessonMaterialSchema); 