import { createClient, RedisClientType } from 'redis';
import { createLogger } from '../utils/logger';

const logger = createLogger('Cache');

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  // In-memory fallback for test environment
  private useMemoryFallback = false;
  private memoryCache = new Map<string, { value: string; expiresAt: number }>();

  async connect(): Promise<void> {
    try {
      // Use in-memory cache during tests or when explicitly enabled
      if (process.env.NODE_ENV === 'test' || process.env.CACHE_USE_MEMORY === 'true') {
        this.useMemoryFallback = true;
        this.isConnected = true;
        logger.info('Using in-memory cache fallback for tests');
        return;
      }

      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      logger.info('✅ Redis cache service initialized');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      // Don't throw error - allow app to run without cache
      this.client = null;
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.useMemoryFallback) {
      this.memoryCache.clear();
      this.isConnected = false;
      this.useMemoryFallback = false;
      return;
    }
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.useMemoryFallback) {
      const entry = this.memoryCache.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        this.memoryCache.delete(key);
        return null;
      }
      try {
        return JSON.parse(entry.value) as T;
      } catch {
        return null;
      }
    }

    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    if (this.useMemoryFallback) {
      const expiresAt = Date.now() + ttlSeconds * 1000;
      try {
        this.memoryCache.set(key, { value: JSON.stringify(value), expiresAt });
        return true;
      } catch (error) {
        logger.error(`Memory cache set error for key ${key}:`, error);
        return false;
      }
    }

    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (this.useMemoryFallback) {
      return this.memoryCache.delete(key);
    }

    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (this.useMemoryFallback) {
      const entry = this.memoryCache.get(key);
      if (!entry) return false;
      const valid = Date.now() <= entry.expiresAt;
      if (!valid) this.memoryCache.delete(key);
      return valid;
    }

    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    if (this.useMemoryFallback) {
      this.memoryCache.clear();
      return true;
    }

    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  async flushAll(): Promise<boolean> {
    return this.flush();
  }

  async deletePattern(pattern: string): Promise<number> {
    if (this.useMemoryFallback) {
      // Support simple glob pattern with '*'
      const regex = new RegExp('^' + pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*') + '$');
      let count = 0;
      for (const key of Array.from(this.memoryCache.keys())) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
          count++;
        }
      }
      return count;
    }

    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      
      await this.client.del(keys);
      return keys.length;
    } catch (error) {
      logger.error(`Cache delete pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Cache with automatic refresh
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFunction();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  // Generate cache keys
  static generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  // Common cache patterns
  async cacheUserData(userId: string, data: any, ttl: number = 1800): Promise<void> {
    const key = CacheService.generateKey('user', userId);
    await this.set(key, data, ttl);
  }

  async getCachedUserData(userId: string): Promise<any> {
    const key = CacheService.generateKey('user', userId);
    return await this.get(key);
  }

  async cacheApiResponse(endpoint: string, params: string, data: any, ttl: number = 600): Promise<void> {
    const key = CacheService.generateKey('api', endpoint, params);
    await this.set(key, data, ttl);
  }

  async getCachedApiResponse(endpoint: string, params: string): Promise<any> {
    const key = CacheService.generateKey('api', endpoint, params);
    return await this.get(key);
  }

  isHealthy(): boolean {
    return this.isConnected || this.useMemoryFallback;
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;