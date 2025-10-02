import mongoose, { Schema, Document } from 'mongoose';

export interface IReservation extends Document {
  teacher: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  actualDate: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'booked' | 'inProgress' | 'completed' | 'cancelled';
  notes?: string;
  isPaid: boolean;
  lessonType?: string;
  lessonLevel?: string;
  lessonDuration?: number; // Duration in minutes
  dayOfWeek?: number; // Day of the week (0-6, Sunday-Saturday) for recurring reservations
  feedback?: string; // Student feedback after lesson
  price?: number; // Lesson price
  paymentApprovedBy?: mongoose.Types.ObjectId; // Admin who approved payment
  paymentApprovedAt?: Date; // When payment was approved
  paymentRejectedBy?: mongoose.Types.ObjectId; // Admin who rejected payment
  paymentRejectedAt?: Date; // When payment was rejected
  rejectionReason?: string; // Reason for payment rejection
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema: Schema = new Schema({
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actualDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'booked', 'inProgress', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String
  },
  isPaid: {
    type: Boolean,
    default: true // Default to true for backward compatibility
  },
  lessonType: {
    type: String
  },
  lessonLevel: {
    type: String
  },
  lessonDuration: {
    type: Number,
    default: 60 // Default 60 minutes
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6 // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  },
  feedback: {
    type: String
  },
  price: {
    type: Number
  },
  paymentApprovedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentApprovedAt: {
    type: Date
  },
  paymentRejectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentRejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
ReservationSchema.index({ teacher: 1, actualDate: 1 });
ReservationSchema.index({ student: 1, actualDate: 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.index({ dayOfWeek: 1 });

export const Reservation = mongoose.model<IReservation>('Reservation', ReservationSchema);