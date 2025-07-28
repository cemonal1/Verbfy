const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  datetimeStart: {
    type: Date,
    required: true
  },
  datetimeEnd: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  lessonType: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  duration: {
    type: Number, // in minutes
    required: true,
    default: 25
  },
  price: {
    type: Number,
    required: true
  },
  notes: {
    student: String,
    teacher: String
  },
  materials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  // LiveKit room information
  livekitRoom: {
    roomId: String,
    roomName: String,
    isActive: {
      type: Boolean,
      default: false
    },
    startedAt: Date,
    endedAt: Date
  },
  // Payment information
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    amount: Number
  }
}, {
  timestamps: true
});

// Indexes for better query performance
reservationSchema.index({ studentId: 1, datetimeStart: 1 });
reservationSchema.index({ teacherId: 1, datetimeStart: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ datetimeStart: 1 });
reservationSchema.index({ 'livekitRoom.roomId': 1 });

// Virtual for checking if reservation is in the past
reservationSchema.virtual('isPast').get(function() {
  return new Date() > this.datetimeEnd;
});

// Virtual for checking if reservation is upcoming
reservationSchema.virtual('isUpcoming').get(function() {
  return new Date() < this.datetimeStart;
});

// Virtual for checking if reservation is currently active
reservationSchema.virtual('isActive').get(function() {
  const now = new Date();
  return now >= this.datetimeStart && now <= this.datetimeEnd;
});

// Method to check if reservation can be cancelled
reservationSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const hoursUntilStart = (this.datetimeStart - now) / (1000 * 60 * 60);
  return this.status === 'confirmed' && hoursUntilStart > 24;
};

// Method to get reservation duration in minutes
reservationSchema.methods.getDurationMinutes = function() {
  return Math.round((this.datetimeEnd - this.datetimeStart) / (1000 * 60));
};

module.exports = mongoose.model('Reservation', reservationSchema); 