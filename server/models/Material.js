const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'image', 'video', 'audio', 'document', 'presentation']
  },
  mimeType: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String // URL to thumbnail image
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Material visibility and access
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Usage tracking
  usage: {
    downloads: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    },
    lastUsed: Date
  },
  // Material metadata
  metadata: {
    language: {
      type: String,
      default: 'en'
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    category: {
      type: String,
      enum: ['grammar', 'vocabulary', 'pronunciation', 'listening', 'reading', 'writing', 'speaking', 'other'],
      default: 'other'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
materialSchema.index({ teacherId: 1 });
materialSchema.index({ fileType: 1 });
materialSchema.index({ isActive: 1 });
materialSchema.index({ 'metadata.category': 1 });
materialSchema.index({ 'metadata.level': 1 });
materialSchema.index({ tags: 1 });

// Virtual for file size in MB
materialSchema.virtual('fileSizeMB').get(function() {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Virtual for file size in KB
materialSchema.virtual('fileSizeKB').get(function() {
  return (this.fileSize / 1024).toFixed(2);
});

// Method to increment download count
materialSchema.methods.incrementDownloads = function() {
  this.usage.downloads += 1;
  this.usage.lastUsed = new Date();
  return this.save();
};

// Method to increment view count
materialSchema.methods.incrementViews = function() {
  this.usage.views += 1;
  this.usage.lastUsed = new Date();
  return this.save();
};

// Method to check if material can be accessed by user
materialSchema.methods.canBeAccessedBy = function(userId, userRole) {
  // Teachers can access their own materials
  if (this.teacherId.toString() === userId.toString()) {
    return true;
  }
  
  // Public materials can be accessed by anyone
  if (this.isPublic) {
    return true;
  }
  
  // Admins can access all materials
  if (userRole === 'admin') {
    return true;
  }
  
  return false;
};

// Static method to get materials by teacher
materialSchema.statics.getByTeacher = function(teacherId, options = {}) {
  const query = { teacherId, isActive: true };
  
  if (options.category) {
    query['metadata.category'] = options.category;
  }
  
  if (options.level) {
    query['metadata.level'] = options.level;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Material', materialSchema); 