import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cacheService';
import { createLogger } from '../utils/logger';

const logger = createLogger('CacheMiddleware');

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
  varyBy?: string[]; // Headers to vary cache by
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false,
    varyBy = []
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests or when skipCache returns true
    if (req.method !== 'GET' || skipCache(req)) {
      return next();
    }

    try {
      const cacheKey = keyGenerator(req);
      
      // Try to get from cache
      const cachedResponse = await cacheService.get(cacheKey);
      
      if (cachedResponse) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        
        // Set cache headers
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        
        // Set vary headers
        if (varyBy.length > 0) {
          varyBy.forEach(header => res.vary(header));
        }
        
        return res.json(cachedResponse);
      }

      logger.debug(`Cache miss for key: ${cacheKey}`);
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(body: any) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, body, ttl).catch(err => {
            logger.error('Failed to cache response:', err);
          });
        }
        
        // Set cache headers
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
        
        // Set vary headers
        if (varyBy.length > 0) {
          varyBy.forEach(header => res.vary(header));
        }
        
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Continue without caching on error
      next();
    }
  };
}

function defaultKeyGenerator(req: Request): string {
  const { method, originalUrl, query } = req;
  const userId = (req as any).user?.id || 'anonymous';
  
  // Create a deterministic key from request data
  const queryString = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
    
  return `api:${method}:${originalUrl}:${userId}:${queryString}`;
}

// Specific cache middleware for different endpoints
export const userDataCache = cacheMiddleware({
  ttl: 1800, // 30 minutes
  keyGenerator: (req) => `user:${(req as any).user?.id}:${req.originalUrl}`,
  skipCache: (req) => !(req as any).user?.id
});

export const publicDataCache = cacheMiddleware({
  ttl: 3600, // 1 hour
  keyGenerator: (req) => `public:${req.originalUrl}:${JSON.stringify(req.query)}`,
});

export const shortCache = cacheMiddleware({
  ttl: 60, // 1 minute
});

export const longCache = cacheMiddleware({
  ttl: 86400, // 24 hours
});

// Cache invalidation helpers
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    // This is a simple implementation - in production you might want
    // to use Redis patterns or maintain a list of keys per user
    const patterns = [
      `user:${userId}:*`,
      `api:*:${userId}:*`
    ];
    
    logger.info(`Invalidating cache for user: ${userId}`);
    // Note: Redis pattern deletion would require additional implementation
    // For now, we'll implement a simple approach
  } catch (error) {
    logger.error('Failed to invalidate user cache:', error);
  }
}

export async function invalidateApiCache(pattern: string): Promise<void> {
  try {
    logger.info(`Invalidating API cache pattern: ${pattern}`);
    // Implementation would depend on Redis pattern matching
  } catch (error) {
    logger.error('Failed to invalidate API cache:', error);
  }
}