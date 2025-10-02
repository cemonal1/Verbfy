import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createLogger } from '../utils/logger';
import { createIndexes } from './indexes';

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
        // Connection Pool Settings
        maxPoolSize: 20, // Maximum number of connections in the pool (increased)
        minPoolSize: 5, // Minimum number of connections in the pool
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        waitQueueTimeoutMS: 5000, // How long to wait for a connection from the pool
        
        // Timeout Settings
        serverSelectionTimeoutMS: 5000, // Timeout for server selection
        socketTimeoutMS: 45000, // Timeout for socket operations
        connectTimeoutMS: 10000, // Timeout for initial connection
        
        // Performance Settings
        bufferCommands: false, // Disable mongoose buffering
        retryWrites: true,
        w: 'majority',
        
        // Monitoring Settings
        monitorCommands: true, // Enable command monitoring
        heartbeatFrequencyMS: 10000, // Heartbeat frequency
        
        // Compression
        compressors: ['zlib'], // Enable compression
        zlibCompressionLevel: 6 // Compression level
      } as any);
      
      isConnected = true;
      dbLogger.info('MongoDB connected successfully');
      
      // Create indexes for optimal performance
      try {
        await createIndexes();
        dbLogger.info('Database indexes created successfully');
      } catch (error) {
        dbLogger.error('Failed to create database indexes:', error);
      }
      
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

      // Connection pool monitoring
      mongoose.connection.on('connectionPoolCreated', () => {
        dbLogger.info('MongoDB connection pool created');
      });

      mongoose.connection.on('connectionPoolClosed', () => {
        dbLogger.warn('MongoDB connection pool closed');
      });

      mongoose.connection.on('connectionCreated', () => {
        dbLogger.debug('New MongoDB connection created');
      });

      mongoose.connection.on('connectionClosed', () => {
        dbLogger.debug('MongoDB connection closed');
      });

      // Command monitoring for performance
      if (process.env.NODE_ENV === 'development') {
        mongoose.connection.on('commandStarted', (event) => {
          dbLogger.debug(`MongoDB command started: ${event.commandName}`, {
            command: event.command,
            requestId: event.requestId
          });
        });

        mongoose.connection.on('commandSucceeded', (event) => {
          dbLogger.debug(`MongoDB command succeeded: ${event.commandName}`, {
            duration: event.duration,
            requestId: event.requestId
          });
        });

        mongoose.connection.on('commandFailed', (event) => {
          dbLogger.error(`MongoDB command failed: ${event.commandName}`, {
            failure: event.failure,
            duration: event.duration,
            requestId: event.requestId
          });
        });
      }
      
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

// Get database connection metrics
export const getDBMetrics = () => {
  if (!mongoose.connection.db) {
    return null;
  }

  const stats = mongoose.connection.db.stats();
  const connectionStatus = {
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    isConnected: isConnected,
    // Connection pool info (if available)
    poolSize: mongoose.connection.db?.serverConfig?.s?.pool?.totalConnectionCount || 0,
    availableConnections: mongoose.connection.db?.serverConfig?.s?.pool?.availableConnectionCount || 0,
    checkedOutConnections: mongoose.connection.db?.serverConfig?.s?.pool?.checkedOutConnectionCount || 0
  };

  return {
    connection: connectionStatus,
    stats: stats
  };
};

// Monitor connection pool health
export const monitorConnectionPool = () => {
  if (!isConnected) {
    return null;
  }

  const metrics = getDBMetrics();
  if (metrics) {
    dbLogger.info('Database connection pool status:', {
      totalConnections: metrics.connection.poolSize,
      availableConnections: metrics.connection.availableConnections,
      checkedOutConnections: metrics.connection.checkedOutConnections,
      readyState: metrics.connection.readyState
    });
  }

  return metrics;
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