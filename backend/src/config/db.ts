import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createLogger } from '../utils/logger';

dotenv.config();

// Create context-specific logger
const dbLogger = createLogger('Database');

// In tests, we use an in-memory MongoDB. Avoid throwing due to missing env.
const MONGO_URI = process.env.MONGO_URI;
let memServer: any = null;
let isConnected = false;

// Helper: sleep for ms milliseconds
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const connectDB = async () => {
  const maxRetries = 5;
  let attempt = 0;
  let delay = 1000; // start with 1s
  
  dbLogger.info('Connecting to MongoDB...');
  
  while (attempt < maxRetries) {
    try {
      let uri = MONGO_URI;
      if (!uri) {
        if (process.env.NODE_ENV === 'test') {
          // Lazy import to avoid production dependency
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          memServer = await MongoMemoryServer.create();
          uri = memServer.getUri();
          dbLogger.info('Using in-memory MongoDB for tests');
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
      
      isConnected = true;
      dbLogger.info('MongoDB connected successfully');
      
      // Set up connection event listeners
      mongoose.connection.on('error', (err) => {
        dbLogger.error('MongoDB connection error:', err);
        isConnected = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        dbLogger.warn('MongoDB disconnected');
        isConnected = false;
      });
      
      mongoose.connection.on('reconnected', () => {
        dbLogger.info('MongoDB reconnected');
        isConnected = true;
      });
      
      return;
    } catch (err) {
      attempt++;
      dbLogger.error(`MongoDB connection failed (attempt ${attempt}/${maxRetries}):`, err);
      
      if (attempt >= maxRetries) {
        dbLogger.error('Could not connect to MongoDB after maximum retries.');
        
        // In development, don't exit the process - allow the app to run without MongoDB
        if (process.env.NODE_ENV === 'development') {
          dbLogger.warn('Running in development mode without MongoDB connection');
          dbLogger.warn('Some features requiring database will not work');
          isConnected = false;
          return;
        }
        
        // In production, exit the process
        dbLogger.error('Exiting process due to MongoDB connection failure');
        process.exit(1);
      }
      
      dbLogger.info(`Retrying in ${delay / 1000}s...`);
      await sleep(delay);
      delay *= 2; // exponential backoff
    }
  }
};

// Check if MongoDB is connected
export const isMongoConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

// Graceful shutdown
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (memServer) {
      await memServer.stop();
      memServer = null;
    }
    isConnected = false;
    dbLogger.info('MongoDB disconnected gracefully');
  } catch (err) {
    dbLogger.error('Error disconnecting from MongoDB:', err);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  dbLogger.info('Received SIGINT, shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  dbLogger.info('Received SIGTERM, shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});