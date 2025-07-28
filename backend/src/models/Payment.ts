import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  reservation: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  amount: number; // in cents
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'credit_card';
  paymentIntentId?: string; // Stripe payment intent ID
  transactionId?: string;
  description: string;
  lessonType: 'VerbfySpeak' | 'VerbfyListen' | 'VerbfyRead' | 'VerbfyWrite' | 'VerbfyGrammar' | 'VerbfyExam';
  lessonDuration: number; // in minutes
  teacherFee: number; // amount teacher receives
  platformFee: number; // amount platform keeps
  refundAmount?: number;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  reservation: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'USD' },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    required: true,
    default: 'pending'
  },
  paymentMethod: { 
    type: String, 
    enum: ['stripe', 'paypal', 'credit_card'], 
    required: true 
  },
  paymentIntentId: { type: String },
  transactionId: { type: String },
  description: { type: String, required: true },
  lessonType: { 
    type: String, 
    enum: ['VerbfySpeak', 'VerbfyListen', 'VerbfyRead', 'VerbfyWrite', 'VerbfyGrammar', 'VerbfyExam'], 
    required: true 
  },
  lessonDuration: { type: Number, required: true },
  teacherFee: { type: Number, required: true, min: 0 },
  platformFee: { type: Number, required: true, min: 0 },
  refundAmount: { type: Number, min: 0 },
  refundReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
PaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
PaymentSchema.index({ reservation: 1 });
PaymentSchema.index({ student: 1 });
PaymentSchema.index({ teacher: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentIntentId: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema); 