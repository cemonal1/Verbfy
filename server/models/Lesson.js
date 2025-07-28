const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  // LiveKit room information
  livekitRoom: {
    roomId: {
      type: String,
      required: true,
      unique: true
    },
    roomName: String,
    isActive: {
      type: Boolean,
      default: false
    },
    startedAt: Date,
    endedAt: Date,
    participants: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      identity: String,
      joinedAt: Date,
      leftAt: Date,
      role: {
        type: String,
        enum: ['host', 'participant'],
        default: 'participant'
      }
    }]
  },
  // Lesson materials
  materials: [{
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    sharedAt: Date,
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Lesson notes and feedback
  notes: {
    teacher: String,
    student: String,
    system: String
  },
  // Lesson status and metrics
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  metrics: {
    duration: Number, // actual duration in minutes
    participantsCount: {
      type: Number,
      default: 0
    },
    materialsShared: {
      type: Number,
      default: 0
    },
    messagesSent: {
      type: Number,
      default: 0
    }
  },
  // Recording information (if enabled)
  recording: {
    enabled: {
      type: Boolean,
      default: false
    },
    url: String,
    duration: Number
  }
}, {
  timestamps: true
});

// Indexes for better query performance
lessonSchema.index({ reservationId: 1 });
lessonSchema.index({ 'livekitRoom.roomId': 1 });
lessonSchema.index({ status: 1 });
lessonSchema.index({ 'livekitRoom.isActive': 1 });

// Virtual for getting lesson duration
lessonSchema.virtual('duration').get(function() {
  if (this.livekitRoom.startedAt && this.livekitRoom.endedAt) {
    return Math.round((this.livekitRoom.endedAt - this.livekitRoom.startedAt) / (1000 * 60));
  }
  return 0;
});

// Method to start the lesson
lessonSchema.methods.startLesson = function() {
  this.status = 'in-progress';
  this.livekitRoom.isActive = true;
  this.livekitRoom.startedAt = new Date();
  return this.save();
};

// Method to end the lesson
lessonSchema.methods.endLesson = function() {
  this.status = 'completed';
  this.livekitRoom.isActive = false;
  this.livekitRoom.endedAt = new Date();
  this.metrics.duration = this.duration;
  return this.save();
};

// Method to add participant
lessonSchema.methods.addParticipant = function(userId, identity, role = 'participant') {
  this.livekitRoom.participants.push({
    userId,
    identity,
    joinedAt: new Date(),
    role
  });
  this.metrics.participantsCount = this.livekitRoom.participants.length;
  return this.save();
};

// Method to remove participant
lessonSchema.methods.removeParticipant = function(userId) {
  const participant = this.livekitRoom.participants.find(p => p.userId.toString() === userId.toString());
  if (participant) {
    participant.leftAt = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('Lesson', lessonSchema); 