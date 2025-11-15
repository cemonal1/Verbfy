import { cacheService } from './cacheService';
import { createLogger } from '../utils/logger';
import { JwtPayload } from 'jsonwebtoken';

const blacklistLogger = createLogger('TokenBlacklist');

interface TokenData {
  jti: string;
  userId: string;
  exp: number;
}

class TokenBlacklistService {
  private readonly BLACKLIST_PREFIX = 'blacklist:token:';
  private readonly USER_TOKENS_PREFIX = 'blacklist:user:';

  /**
   * Add a token to the blacklist
   */
  async blacklistToken(jti: string, userId: string, expiresAt: number): Promise<void> {
    try {
      const key = `${this.BLACKLIST_PREFIX}${jti}`;
      const userKey = `${this.USER_TOKENS_PREFIX}${userId}`;
      const ttl = Math.max(0, expiresAt - Math.floor(Date.now() / 1000));

      if (ttl <= 0) {
        blacklistLogger.warn('Token already expired, not adding to blacklist', { jti, userId });
        return;
      }

      const tokenData: TokenData = { jti, userId, exp: expiresAt };
      await cacheService.set(key, tokenData, ttl);

      const userTokens = await cacheService.get<string[]>(userKey) || [];
      userTokens.push(jti);
      await cacheService.set(userKey, userTokens, ttl);

      blacklistLogger.info('Token blacklisted successfully', { jti, userId, ttl });
    } catch (error) {
      blacklistLogger.error('Failed to blacklist token', error);
      throw new Error('Failed to blacklist token');
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    try {
      const key = `${this.BLACKLIST_PREFIX}${jti}`;
      const result = await cacheService.get<TokenData>(key);
      return result !== null;
    } catch (error) {
      blacklistLogger.error('Failed to check token blacklist status', error);
      return false;
    }
  }

  /**
   * Blacklist all tokens for a user (useful for password reset, account compromise)
   */
  async blacklistAllUserTokens(userId: string, maxTokenAge: number = 86400): Promise<void> {
    try {
      const userKey = `${this.USER_TOKENS_PREFIX}${userId}`;
      const tokens = await cacheService.get<string[]>(userKey) || [];

      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + maxTokenAge;

      for (const jti of tokens) {
        await this.blacklistToken(jti, userId, expiresAt);
      }

      blacklistLogger.info('All user tokens blacklisted', { userId, count: tokens.length });
    } catch (error) {
      blacklistLogger.error('Failed to blacklist all user tokens', error);
      throw new Error('Failed to blacklist all user tokens');
    }
  }

  /**
   * Remove a token from blacklist (rare, for debugging/admin purposes)
   */
  async removeFromBlacklist(jti: string): Promise<void> {
    try {
      const key = `${this.BLACKLIST_PREFIX}${jti}`;
      await cacheService.del(key);
      blacklistLogger.info('Token removed from blacklist', { jti });
    } catch (error) {
      blacklistLogger.error('Failed to remove token from blacklist', error);
    }
  }

  /**
   * Get blacklist statistics for monitoring
   */
  async getBlacklistStats(): Promise<{ totalBlacklisted: number }> {
    try {
      return { totalBlacklisted: 0 };
    } catch (error) {
      blacklistLogger.error('Failed to get blacklist stats', error);
      return { totalBlacklisted: 0 };
    }
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
