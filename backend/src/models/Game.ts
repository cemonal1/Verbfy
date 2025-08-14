import mongoose, { Document, Schema } from 'mongoose';

export interface GameDoc extends Document {
  title: string;
  description?: string;
  category?: string; // Vocabulary, Grammar, Listening, etc.
  level?: string; // A1..C2
  thumbnailUrl?: string;
  gameUrl: string;
}

const GameSchema = new Schema<GameDoc>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String },
    level: { type: String },
    thumbnailUrl: { type: String },
    gameUrl: { type: String, required: true },
  },
  { timestamps: true }
);

GameSchema.index({ title: 'text', description: 'text', category: 1, level: 1 });

export const Game = mongoose.models.Game || mongoose.model<GameDoc>('Game', GameSchema);


