import mongoose from 'mongoose';
import { createLogger } from '../utils/logger';

const indexLogger = createLogger('database-indexes');

// Define indexes for optimal query performance
export const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    indexLogger.info('Creating database indexes...');

    // User collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1, status: 1 });
    await db.collection('users').createIndex({ 'profile.firstName': 1, 'profile.lastName': 1 });
    await db.collection('users').createIndex({ 'profile.firstName': 'text', 'profile.lastName': 'text', email: 'text' });
    await db.collection('users').createIndex({ createdAt: -1 });
    await db.collection('users').createIndex({ lastLogin: -1 });
    await db.collection('users').createIndex({ 'teacherProfile.isApproved': 1, status: 1 });

    // Lesson collection indexes
    await db.collection('lessons').createIndex({ teacherId: 1, status: 1 });
    await db.collection('lessons').createIndex({ studentId: 1, status: 1 });
    await db.collection('lessons').createIndex({ scheduledAt: 1 });
    await db.collection('lessons').createIndex({ status: 1, scheduledAt: -1 });
    await db.collection('lessons').createIndex({ teacherId: 1, scheduledAt: -1 });
    await db.collection('lessons').createIndex({ studentId: 1, scheduledAt: -1 });
    await db.collection('lessons').createIndex({ createdAt: -1 });
    
    // Compound indexes for analytics
    await db.collection('lessons').createIndex({ 
      teacherId: 1, 
      status: 1, 
      scheduledAt: -1 
    });
    await db.collection('lessons').createIndex({ 
      studentId: 1, 
      status: 1, 
      scheduledAt: -1 
    });

    // Rating collection indexes
    await db.collection('ratings').createIndex({ teacherId: 1, createdAt: -1 });
    await db.collection('ratings').createIndex({ studentId: 1, createdAt: -1 });
    await db.collection('ratings').createIndex({ lessonId: 1 }, { unique: true });
    await db.collection('ratings').createIndex({ rating: -1, createdAt: -1 });

    // Payment collection indexes
    await db.collection('payments').createIndex({ userId: 1, status: 1 });
    await db.collection('payments').createIndex({ lessonId: 1 });
    await db.collection('payments').createIndex({ status: 1, createdAt: -1 });
    await db.collection('payments').createIndex({ teacherId: 1, status: 1, createdAt: -1 });

    // Material collection indexes
    await db.collection('materials').createIndex({ uploadedBy: 1, createdAt: -1 });
    await db.collection('materials').createIndex({ type: 1, status: 1 });
    await db.collection('materials').createIndex({ 'metadata.subject': 1, 'metadata.level': 1 });

    // Notification collection indexes
    await db.collection('notifications').createIndex({ userId: 1, isRead: 1, createdAt: -1 });
    await db.collection('notifications').createIndex({ type: 1, createdAt: -1 });

    // Session collection indexes (if using database sessions)
    await db.collection('sessions').createIndex({ userId: 1 });
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // Audit log indexes
    await db.collection('auditlogs').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('auditlogs').createIndex({ action: 1, createdAt: -1 });
    await db.collection('auditlogs').createIndex({ resourceType: 1, resourceId: 1 });

    indexLogger.info('Database indexes created successfully');
  } catch (error) {
    indexLogger.error('Error creating database indexes:', error);
    throw error;
  }
};

// Check existing indexes
export const checkIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    const collections = ['users', 'lessons', 'ratings', 'payments', 'materials', 'notifications'];
    const indexInfo: Record<string, any[]> = {};

    for (const collectionName of collections) {
      try {
        const indexes = await db.collection(collectionName).indexes();
        indexInfo[collectionName] = indexes;
        indexLogger.info(`${collectionName} indexes:`, indexes.map(idx => idx.name));
      } catch (error) {
        indexLogger.warn(`Collection ${collectionName} not found or error getting indexes:`, error);
      }
    }

    return indexInfo;
  } catch (error) {
    indexLogger.error('Error checking indexes:', error);
    throw error;
  }
};

// Analyze query performance
export const analyzeQueryPerformance = async (collection: string, query: any) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    const explain = await db.collection(collection).find(query).explain('executionStats');
    
    const stats = {
      totalDocsExamined: explain.executionStats.totalDocsExamined,
      totalKeysExamined: explain.executionStats.totalKeysExamined,
      executionTimeMillis: explain.executionStats.executionTimeMillis,
      indexUsed: explain.executionStats.executionStages?.indexName || 'COLLSCAN',
      docsReturned: explain.executionStats.docsReturned,
      efficiency: explain.executionStats.docsReturned / Math.max(explain.executionStats.totalDocsExamined, 1)
    };

    indexLogger.info(`Query performance for ${collection}:`, stats);
    return stats;
  } catch (error) {
    indexLogger.error('Error analyzing query performance:', error);
    throw error;
  }
};

// Drop unused indexes
export const dropUnusedIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    // Get index usage stats (requires MongoDB 3.2+)
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      try {
        const stats = await db.collection(collection.name).aggregate([
          { $indexStats: {} }
        ]).toArray();

        const unusedIndexes = stats.filter(stat => 
          stat.accesses.ops === 0 && 
          stat.name !== '_id_' // Never drop the _id index
        );

        if (unusedIndexes.length > 0) {
          indexLogger.warn(`Unused indexes in ${collection.name}:`, unusedIndexes.map(idx => idx.name));
        }
      } catch (error) {
        // $indexStats might not be available in all MongoDB versions
        indexLogger.debug(`Could not get index stats for ${collection.name}:`, error);
      }
    }
  } catch (error) {
    indexLogger.error('Error checking unused indexes:', error);
    throw error;
  }
};

export default {
  createIndexes,
  checkIndexes,
  analyzeQueryPerformance,
  dropUnusedIndexes
};