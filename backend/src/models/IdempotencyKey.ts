import mongoose, { Document, Model, Schema } from 'mongoose';

export type IdempotencyStatus = 'in_progress' | 'completed';

export interface IdempotencyKeyAttrs {
  key: string;
  userId?: string | null;
  method: string;
  path: string;
  requestHash?: string | null;
  status: IdempotencyStatus;
  responseStatus?: number | null;
  responseBody?: any;
  expiresAt?: Date;
}

export interface IdempotencyKeyDoc extends Document, IdempotencyKeyAttrs {
  createdAt: Date;
  updatedAt: Date;
}

const IdempotencyKeySchema = new Schema<IdempotencyKeyDoc>({
  key: { type: String, required: true },
  userId: { type: String, default: null, index: true },
  method: { type: String, required: true },
  path: { type: String, required: true },
  requestHash: { type: String, default: null },
  status: { type: String, enum: ['in_progress', 'completed'], required: true, index: true },
  responseStatus: { type: Number, default: null },
  responseBody: { type: Schema.Types.Mixed, default: null },
  expiresAt: { type: Date, index: { expires: 0 } }, // TTL based on value
}, { timestamps: true });

// Uniqueness per key + user scope (userId may be null)
IdempotencyKeySchema.index({ key: 1, userId: 1 }, { unique: true });

export const IdempotencyKey: Model<IdempotencyKeyDoc> = mongoose.models.IdempotencyKey || mongoose.model<IdempotencyKeyDoc>('IdempotencyKey', IdempotencyKeySchema);


