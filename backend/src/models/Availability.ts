import mongoose, { Document, Schema } from 'mongoose';

export interface IAvailability extends Document {
  teacher: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format in teacher's timezone
  endTime: string; // HH:MM format in teacher's timezone
  teacherTimezone: string; // Teacher's timezone (e.g., 'America/New_York')
  isRecurring: boolean; // Whether this is a recurring weekly slot
  isBooked: boolean; // Whether this slot is currently booked
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySchema = new Schema<IAvailability>({
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  teacherTimezone: { type: String, required: true, default: 'UTC' },
  isRecurring: { type: Boolean, default: true },
  isBooked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
AvailabilitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound index for efficient queries
AvailabilitySchema.index({ teacher: 1, dayOfWeek: 1, startTime: 1 });
AvailabilitySchema.index({ teacher: 1, isBooked: 1 });

export const Availability = mongoose.model<IAvailability>('Availability', AvailabilitySchema); 