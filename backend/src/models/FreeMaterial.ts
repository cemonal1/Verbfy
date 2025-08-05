import mongoose, { Document, Schema } from 'mongoose';

export interface IFreeMaterial extends Document {
  title: string;
  description: string;
  type: 'pdf' | 'image' | 'video' | 'audio' | 'document' | 'presentation' | 'worksheet' | 'quiz';
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId;
  category: 'Grammar' | 'Vocabulary' | 'Speaking' | 'Listening' | 'Reading' | 'Writing' | 'Pronunciation' | 'Business' | 'Travel' | 'Academic' | 'General';
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  tags: string[];
  downloadCount: number;
  rating: number;
  ratingCount: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  updateRating(newRating: number): Promise<IFreeMaterial>;
  incrementDownload(): Promise<IFreeMaterial>;
}

const FreeMaterialSchema = new Schema<IFreeMaterial>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['pdf', 'image', 'video', 'audio', 'document', 'presentation', 'worksheet', 'quiz'],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['Grammar', 'Vocabulary', 'Speaking', 'Listening', 'Reading', 'Writing', 'Pronunciation', 'Business', 'Travel', 'Academic', 'General'],
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  downloadCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
FreeMaterialSchema.index({ category: 1, level: 1 });
FreeMaterialSchema.index({ isActive: 1, isFeatured: 1 });
FreeMaterialSchema.index({ tags: 1 });
FreeMaterialSchema.index({ rating: -1 });
FreeMaterialSchema.index({ downloadCount: -1 });
FreeMaterialSchema.index({ createdAt: -1 });
FreeMaterialSchema.index({ uploadedBy: 1 });

// Virtual for average rating
FreeMaterialSchema.virtual('averageRating').get(function() {
  return this.ratingCount > 0 ? (this.rating / this.ratingCount).toFixed(1) : 0;
});

// Virtual for preview URL
FreeMaterialSchema.virtual('previewURL').get(function() {
  return `/api/free-materials/${this._id}/preview`;
});

// Virtual for download URL
FreeMaterialSchema.virtual('downloadURL').get(function() {
  return `/api/free-materials/${this._id}/download`;
});

// Ensure virtuals are serialized
FreeMaterialSchema.set('toJSON', { virtuals: true });
FreeMaterialSchema.set('toObject', { virtuals: true });

// Method to update rating
FreeMaterialSchema.methods.updateRating = function(newRating: number) {
  this.rating = ((this.rating * this.ratingCount) + newRating) / (this.ratingCount + 1);
  this.ratingCount += 1;
  return this.save();
};

// Method to increment download count
FreeMaterialSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

export const FreeMaterial = mongoose.model<IFreeMaterial>('FreeMaterial', FreeMaterialSchema); 