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
  }
}, {
  timestamps: true
});

// Index for faster queries
ReservationSchema.index({ teacher: 1, actualDate: 1 });
ReservationSchema.index({ student: 1, actualDate: 1 });
ReservationSchema.index({ status: 1 });

export const Reservation = mongoose.model<IReservation>('Reservation', ReservationSchema); 