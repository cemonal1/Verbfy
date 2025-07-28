import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable is required');
}

// Helper: sleep for ms milliseconds
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const connectDB = async () => {
  const maxRetries = 3;
  let attempt = 0;
  let delay = 1000; // start with 1s
  while (attempt < maxRetries) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('✅ MongoDB connected');
      return;
    } catch (err) {
      attempt++;
      if (attempt < maxRetries) {
        console.error(`❌ MongoDB connection failed (attempt ${attempt}): ${err}`);
        console.log(`🔁 Retrying in ${delay / 1000}s...`);
        await sleep(delay);
        delay *= 2; // exponential backoff
      } else {
        console.error(`❌ Could not connect to MongoDB after ${maxRetries} attempts. Exiting.`);
        process.exit(1);
      }
    }
  }
}; 