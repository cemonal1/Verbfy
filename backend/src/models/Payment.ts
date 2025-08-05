import mongoose, { Document, Schema } from 'mongoose';

// Payment types
export type PaymentType = 'subscription' | 'lesson_tokens' | 'one_time';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';

// Payment interface
export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  product: {
    id: string;
    name: string;
    description?: string;
    quantity?: number; // For lesson tokens
    duration?: number; // For subscriptions (in days)
  };
  metadata?: {
    lessonTokens?: number;
    subscriptionExpiry?: Date;
    couponCode?: string;
    discountAmount?: number;
  };
  refundedAt?: Date;
  refundedBy?: mongoose.Types.ObjectId;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment schema
const PaymentSchema = new Schema<IPayment>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['subscription', 'lesson_tokens', 'one_time'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'usd',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  stripeSessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  stripePaymentIntentId: {
    type: String,
    sparse: true,
    index: true
  },
  product: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    quantity: Number,
    duration: Number
  },
  metadata: {
    lessonTokens: Number,
    subscriptionExpiry: Date,
    couponCode: String,
    discountAmount: Number
  },
  refundedAt: Date,
  refundedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  refundReason: String
}, {
  timestamps: true
});

// Indexes for better query performance
PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ type: 1 });
PaymentSchema.index({ 'product.id': 1 });

// Virtual for formatted amount
PaymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency.toUpperCase()
  }).format(this.amount / 100); // Stripe amounts are in cents
});

// Virtual for payment age
PaymentSchema.virtual('age').get(function() {
  const now = new Date();
  const diffInMs = now.getTime() - this.createdAt.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
});

// Static method to get user's payment history
PaymentSchema.statics.getUserPayments = async function(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const payments = await this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email')
    .lean();
    
  const total = await this.countDocuments({ user: userId });
  
  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get payment statistics
PaymentSchema.statics.getPaymentStats = async function(userId?: string) {
  const matchStage = userId ? { user: new mongoose.Types.ObjectId(userId) } : {};
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        completedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        refundedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    completedPayments: 0,
    completedAmount: 0,
    failedPayments: 0,
    refundedPayments: 0
  };
};

// Instance method to mark as refunded
PaymentSchema.methods.markAsRefunded = async function(refundedBy: string, reason?: string) {
  this.status = 'refunded';
  this.refundedAt = new Date();
  this.refundedBy = refundedBy;
  this.refundReason = reason;
  return this.save();
};

// Define static methods interface
interface PaymentModel extends mongoose.Model<IPayment> {
  getUserPayments(userId: string, page?: number, limit?: number): Promise<{
    payments: IPayment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>;
  getPaymentStats(userId?: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    completedPayments: number;
    completedAmount: number;
    failedPayments: number;
    refundedPayments: number;
  }>;
}

// Define instance methods interface
interface IPaymentDocument extends IPayment, Document {
  markAsRefunded(refundedBy: string, reason?: string): Promise<IPaymentDocument>;
}

// Ensure virtuals are included when converting to JSON
PaymentSchema.set('toJSON', { virtuals: true });
PaymentSchema.set('toObject', { virtuals: true });

export const Payment = mongoose.model<IPayment, PaymentModel>('Payment', PaymentSchema); 