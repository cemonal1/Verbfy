import mongoose, { Document, Schema } from 'mongoose';

export interface ILessonFile extends Document {
  lessonId: string;
  uploadedBy: mongoose.Types.ObjectId;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  uploadedAt: Date;
  downloadCount: number;
  isDeleted?: boolean;
  deletedAt?: Date;
  tags?: string[];
  thumbnail?: string;
}

const LessonFileSchema = new Schema<ILessonFile>({
  lessonId: {
    type: String,
    required: true,
    index: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  thumbnail: {
    type: String // Path to thumbnail for images/videos
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
LessonFileSchema.index({ lessonId: 1, uploadedAt: -1 });
LessonFileSchema.index({ lessonId: 1, uploadedBy: 1 });
LessonFileSchema.index({ mimeType: 1 });

// Virtual for file type category
LessonFileSchema.virtual('fileCategory').get(function() {
  if (this.mimeType.startsWith('image/')) return 'image';
  if (this.mimeType.startsWith('video/')) return 'video';
  if (this.mimeType.startsWith('audio/')) return 'audio';
  if (this.mimeType.includes('pdf')) return 'pdf';
  if (this.mimeType.includes('word') || this.mimeType.includes('document')) return 'document';
  if (this.mimeType.includes('powerpoint') || this.mimeType.includes('presentation')) return 'presentation';
  return 'other';
});

// Virtual for formatted file size
LessonFileSchema.virtual('formattedSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for file extension
LessonFileSchema.virtual('fileExtension').get(function() {
  return this.fileName.split('.').pop()?.toLowerCase() || '';
});

// Method to increment download count
LessonFileSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

// Method to soft delete file
LessonFileSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static method to get files by category
LessonFileSchema.statics.getFilesByCategory = function(lessonId: string, category: string) {
  const mimeTypePattern = (this as any).getCategoryMimePattern(category);
  return this.find({ 
    lessonId, 
    isDeleted: { $ne: true },
    mimeType: { $regex: mimeTypePattern, $options: 'i' }
  })
  .populate('uploadedBy', 'name email role')
  .sort({ uploadedAt: -1 });
};

// Static method to get mime type pattern for category
LessonFileSchema.statics.getCategoryMimePattern = function(category: string): string {
  switch (category) {
    case 'image': return '^image/';
    case 'video': return '^video/';
    case 'audio': return '^audio/';
    case 'pdf': return 'pdf';
    case 'document': return '(word|document)';
    case 'presentation': return '(powerpoint|presentation)';
    default: return '.*';
  }
};

// Static method to get lesson file statistics
LessonFileSchema.statics.getLessonFileStats = function(lessonId: string) {
  return this.aggregate([
    { $match: { lessonId, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$fileSize' },
        totalDownloads: { $sum: '$downloadCount' },
        fileTypes: { $addToSet: '$mimeType' }
      }
    }
  ]);
};

export const LessonFile = mongoose.model<ILessonFile>('LessonFile', LessonFileSchema);