import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// In tests, we use an in-memory MongoDB. Avoid throwing due to missing env.
const MONGO_URI = process.env.MONGO_URI;
let memServer: any = null;

// Helper: sleep for ms milliseconds
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const connectDB = async () => {
  const maxRetries = 5;
  let attempt = 0;
  let delay = 1000; // start with 1s
  
  console.log('🔌 Connecting to MongoDB...');
  
  while (attempt < maxRetries) {
    try {
      let uri = MONGO_URI;
      if (!uri) {
        if (process.env.NODE_ENV === 'test') {
          // Lazy import to avoid production dependency
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          memServer = await MongoMemoryServer.create();
          uri = memServer.getUri();
          console.log('🧪 Using in-memory MongoDB for tests');
        } else {
          throw new Error('MONGO_URI environment variable is required');
        }
      }

      await mongoose.connect(uri as string, {
        maxPoolSize: 10, // Maximum number of connections in the pool
        serverSelectionTimeoutMS: 5000, // Timeout for server selection
        socketTimeoutMS: 45000, // Timeout for socket operations
        bufferCommands: false, // Disable mongoose buffering
        retryWrites: true,
        w: 'majority'
      } as any);
      
      console.log('✅ MongoDB connected successfully');
      
      // Set up connection event listeners
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
      });
      
      return;
    } catch (err) {
      attempt++;
      console.error(`❌ MongoDB connection failed (attempt ${attempt}/${maxRetries}):`, err);
      
      if (attempt >= maxRetries) {
        console.error('❌ Could not connect to MongoDB after maximum retries. Exiting.');
        process.exit(1);
      }
      
      console.log(`🔁 Retrying in ${delay / 1000}s...`);
      await sleep(delay);
      delay *= 2; // exponential backoff
    }
  }
};

// Graceful shutdown
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (memServer) {
      await memServer.stop();
      memServer = null;
    }
    console.log('✅ MongoDB disconnected gracefully');
  } catch (err) {
    console.error('❌ Error disconnecting from MongoDB:', err);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
}); 