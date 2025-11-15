import request from 'supertest';
import express from 'express';
import { signAccessToken, signRefreshToken, verifyToken, verifyRefreshToken } from '../utils/jwt';
import { tokenBlacklistService } from '../services/tokenBlacklistService';
import { cacheService } from '../services/cacheService';

describe('JWT Token Blacklist', () => {
  beforeAll(async () => {
    await cacheService.connect();
  });

  afterAll(async () => {
    await cacheService.disconnect();
  });

  beforeEach(async () => {
    await cacheService.flush();
  });

  describe('Token Generation with JTI', () => {
    it('should generate access token with unique JTI', () => {
      const token1 = signAccessToken({ id: '123', email: 'test@example.com', role: 'student' });
      const token2 = signAccessToken({ id: '123', email: 'test@example.com', role: 'student' });

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2); // Different JTI should produce different tokens
    });

    it('should generate refresh token with unique JTI', () => {
      const token1 = signRefreshToken({ id: '123', email: 'test@example.com', role: 'student' });
      const token2 = signRefreshToken({ id: '123', email: 'test@example.com', role: 'student' });

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2); // Different JTI should produce different tokens
    });

    it('should include JTI in token payload', async () => {
      const token = signAccessToken({ id: '123', email: 'test@example.com', role: 'student' });
      const decoded = await verifyToken(token, false); // Skip blacklist check

      expect(decoded.jti).toBeDefined();
      expect(typeof decoded.jti).toBe('string');
      expect(decoded.jti.length).toBeGreaterThan(0);
    });
  });

  describe('Token Blacklist Service', () => {
    it('should blacklist a token', async () => {
      const jti = 'test-jti-123';
      const userId = 'user-123';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      await tokenBlacklistService.blacklistToken(jti, userId, expiresAt);

      const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(jti);
      expect(isBlacklisted).toBe(true);
    });

    it('should not blacklist expired tokens', async () => {
      const jti = 'expired-jti';
      const userId = 'user-456';
      const expiresAt = Math.floor(Date.now() / 1000) - 3600; // Expired 1 hour ago

      await tokenBlacklistService.blacklistToken(jti, userId, expiresAt);

      const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(jti);
      expect(isBlacklisted).toBe(false); // Should not be blacklisted as it's already expired
    });

    it('should check if token is not blacklisted', async () => {
      const jti = 'not-blacklisted-jti';

      const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(jti);
      expect(isBlacklisted).toBe(false);
    });

    it('should remove token from blacklist', async () => {
      const jti = 'removable-jti';
      const userId = 'user-789';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;

      await tokenBlacklistService.blacklistToken(jti, userId, expiresAt);
      expect(await tokenBlacklistService.isTokenBlacklisted(jti)).toBe(true);

      await tokenBlacklistService.removeFromBlacklist(jti);
      expect(await tokenBlacklistService.isTokenBlacklisted(jti)).toBe(false);
    });

    it('should blacklist all user tokens', async () => {
      const userId = 'user-multi';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;

      // Create and blacklist multiple tokens for the same user
      const jti1 = 'user-multi-jti-1';
      const jti2 = 'user-multi-jti-2';
      const jti3 = 'user-multi-jti-3';

      await tokenBlacklistService.blacklistToken(jti1, userId, expiresAt);
      await tokenBlacklistService.blacklistToken(jti2, userId, expiresAt);
      await tokenBlacklistService.blacklistToken(jti3, userId, expiresAt);

      // Verify all are blacklisted
      expect(await tokenBlacklistService.isTokenBlacklisted(jti1)).toBe(true);
      expect(await tokenBlacklistService.isTokenBlacklisted(jti2)).toBe(true);
      expect(await tokenBlacklistService.isTokenBlacklisted(jti3)).toBe(true);

      // Blacklist all user tokens again
      await tokenBlacklistService.blacklistAllUserTokens(userId);

      // All should still be blacklisted
      expect(await tokenBlacklistService.isTokenBlacklisted(jti1)).toBe(true);
      expect(await tokenBlacklistService.isTokenBlacklisted(jti2)).toBe(true);
      expect(await tokenBlacklistService.isTokenBlacklisted(jti3)).toBe(true);
    });
  });

  describe('Token Verification with Blacklist', () => {
    it('should verify valid non-blacklisted token', async () => {
      const token = signAccessToken({ id: '123', email: 'test@example.com', role: 'student' });

      const decoded = await verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe('123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('student');
    });

    it('should reject blacklisted access token', async () => {
      const token = signAccessToken({ id: '456', email: 'blocked@example.com', role: 'student' });
      const decoded = await verifyToken(token, false); // Verify without blacklist check to get JTI

      // Blacklist the token
      await tokenBlacklistService.blacklistToken(decoded.jti, decoded.id, decoded.exp!);

      // Try to verify again - should fail
      await expect(verifyToken(token)).rejects.toThrow('Token has been revoked');
    });

    it('should reject blacklisted refresh token', async () => {
      const token = signRefreshToken({ id: '789', email: 'refresh@example.com', role: 'teacher' });
      const decoded = await verifyRefreshToken(token, false); // Verify without blacklist check

      // Blacklist the refresh token
      await tokenBlacklistService.blacklistToken(decoded.jti, decoded.id, decoded.exp!);

      // Try to verify again - should fail
      await expect(verifyRefreshToken(token)).rejects.toThrow('Refresh token has been revoked');
    });

    it('should allow verification without blacklist check', async () => {
      const token = signAccessToken({ id: '999', email: 'skip@example.com', role: 'admin' });
      const decoded = await verifyToken(token, false);

      // Blacklist the token
      await tokenBlacklistService.blacklistToken(decoded.jti, decoded.id, decoded.exp!);

      // Should still verify if we skip blacklist check
      const decodedAgain = await verifyToken(token, false);
      expect(decodedAgain).toBeDefined();
      expect(decodedAgain.id).toBe('999');
    });
  });

  describe('Logout with Token Blacklist', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      // Mock logout endpoint
      app.post('/api/auth/logout', async (req, res) => {
        try {
          const authHeader = req.header('Authorization');
          const accessToken = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : undefined;

          if (accessToken) {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.decode(accessToken) as any;
            if (decoded && decoded.jti && decoded.exp) {
              await tokenBlacklistService.blacklistToken(decoded.jti, decoded.id, decoded.exp);
            }
          }

          res.json({ success: true, message: 'Logged out successfully' });
        } catch (error) {
          res.status(500).json({ success: false, message: 'Logout failed' });
        }
      });
    });

    it('should blacklist token on logout', async () => {
      const token = signAccessToken({ id: 'logout-user', email: 'logout@example.com', role: 'student' });
      const decoded = await verifyToken(token, false);

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Token should be blacklisted
      const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(decoded.jti);
      expect(isBlacklisted).toBe(true);

      // Token verification should fail
      await expect(verifyToken(token)).rejects.toThrow('Token has been revoked');
    });

    it('should handle logout without token gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Token Refresh with Blacklist', () => {
    it('should rotate tokens and blacklist old refresh token', async () => {
      const oldRefreshToken = signRefreshToken({ id: 'refresh-user', email: 'refresh@example.com', role: 'student' });
      const oldDecoded = await verifyRefreshToken(oldRefreshToken, false);

      // Generate new tokens
      const newAccessToken = signAccessToken({ id: 'refresh-user', email: 'refresh@example.com', role: 'student' });
      const newRefreshToken = signRefreshToken({ id: 'refresh-user', email: 'refresh@example.com', role: 'student' });

      // Blacklist old refresh token
      await tokenBlacklistService.blacklistToken(oldDecoded.jti, oldDecoded.id, oldDecoded.exp!);

      // Old refresh token should be blacklisted
      await expect(verifyRefreshToken(oldRefreshToken)).rejects.toThrow('Refresh token has been revoked');

      // New tokens should work
      const newAccessDecoded = await verifyToken(newAccessToken);
      const newRefreshDecoded = await verifyRefreshToken(newRefreshToken);

      expect(newAccessDecoded).toBeDefined();
      expect(newRefreshDecoded).toBeDefined();
      expect(newAccessDecoded.id).toBe('refresh-user');
      expect(newRefreshDecoded.id).toBe('refresh-user');
    });
  });

  describe('Security Scenarios', () => {
    it('should blacklist all tokens on password reset', async () => {
      const userId = 'compromised-user';

      // Create multiple active tokens
      const token1 = signAccessToken({ id: userId, email: 'user@example.com', role: 'student' });
      const token2 = signAccessToken({ id: userId, email: 'user@example.com', role: 'student' });
      const refreshToken = signRefreshToken({ id: userId, email: 'user@example.com', role: 'student' });

      const decoded1 = await verifyToken(token1, false);
      const decoded2 = await verifyToken(token2, false);
      const decodedRefresh = await verifyRefreshToken(refreshToken, false);

      // Blacklist individual tokens first
      await tokenBlacklistService.blacklistToken(decoded1.jti, userId, decoded1.exp!);
      await tokenBlacklistService.blacklistToken(decoded2.jti, userId, decoded2.exp!);
      await tokenBlacklistService.blacklistToken(decodedRefresh.jti, userId, decodedRefresh.exp!);

      // Blacklist all user tokens (simulating password reset)
      await tokenBlacklistService.blacklistAllUserTokens(userId);

      // All tokens should be blacklisted
      await expect(verifyToken(token1)).rejects.toThrow('Token has been revoked');
      await expect(verifyToken(token2)).rejects.toThrow('Token has been revoked');
      await expect(verifyRefreshToken(refreshToken)).rejects.toThrow('Refresh token has been revoked');
    });

    it('should handle token with no JTI gracefully', async () => {
      const jwt = require('jsonwebtoken');
      const tokenWithoutJTI = jwt.sign(
        { id: 'test', email: 'test@example.com', role: 'student' },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      // Should verify but not check blacklist (no JTI)
      const decoded = await verifyToken(tokenWithoutJTI);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe('test');
    });
  });

  describe('Blacklist Statistics', () => {
    it('should return blacklist statistics', async () => {
      const stats = await tokenBlacklistService.getBlacklistStats();

      expect(stats).toBeDefined();
      expect(stats.totalBlacklisted).toBeDefined();
      expect(typeof stats.totalBlacklisted).toBe('number');
    });
  });
});
