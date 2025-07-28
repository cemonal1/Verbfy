import mongoose, { Document, Schema } from 'mongoose';

export interface IReservation extends Document {
  student: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format in teacher's timezone
  endTime: string; // HH:MM format in teacher's timezone
  actualDate: Date; // Actual date when lesson occurs (required)
  teacherTimezone: string; // Teacher's timezone
  studentTimezone?: string; // Student's timezone (optional)
  lessonType: 'VerbfySpeak' | 'VerbfyListen' | 'VerbfyRead' | 'VerbfyWrite' | 'VerbfyGrammar' | 'VerbfyExam';
  lessonLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  lessonDuration: number; // in minutes
  status: 'booked' | 'completed' | 'cancelled' | 'no-show';
  feedback?: string;
  notes?: string; // Additional notes from student or teacher
  materials?: string[]; // Array of material IDs
  recordingUrl?: string; // URL to lesson recording
  rating?: number; // Student rating (1-5)
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  actualDate: { type: Date, required: true }, // Required: specific date when lesson occurs
  teacherTimezone: { type: String, required: true, default: 'UTC' },
  studentTimezone: { type: String },
  lessonType: { 
    type: String, 
    enum: ['VerbfySpeak', 'VerbfyListen', 'VerbfyRead', 'VerbfyWrite', 'VerbfyGrammar', 'VerbfyExam'], 
    required: true,
    default: 'VerbfySpeak'
  },
  lessonLevel: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'], 
    required: true,
    default: 'Intermediate'
  },
  lessonDuration: { type: Number, required: true, default: 30 }, // 30 minutes default
  status: { type: String, enum: ['booked', 'completed', 'cancelled', 'no-show'], default: 'booked' },
  feedback: { type: String },
  notes: { type: String },
  materials: [{ type: Schema.Types.ObjectId, ref: 'LessonMaterial' }],
  recordingUrl: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
ReservationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound indexes for efficient queries
ReservationSchema.index({ teacher: 1, actualDate: 1, startTime: 1 }); // For double-booking prevention
ReservationSchema.index({ student: 1, status: 1 }); // For student's bookings
ReservationSchema.index({ teacher: 1, status: 1 }); // For teacher's bookings
ReservationSchema.index({ actualDate: 1, status: 1 }); // For date-based queries
ReservationSchema.index({ lessonType: 1, status: 1 }); // For lesson type queries
ReservationSchema.index({ lessonLevel: 1, status: 1 }); // For level-based queries

export const Reservation = mongoose.model<IReservation>('Reservation', ReservationSchema); 