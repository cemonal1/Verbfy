import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from './logger';
import { tokenBlacklistService } from '../services/tokenBlacklistService';

const jwtLogger = createLogger('JWT');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  jwtLogger.error('JWT Configuration Error: JWT_SECRET and JWT_REFRESH_SECRET must be defined');
  jwtLogger.error('To fix: Set JWT_SECRET and JWT_REFRESH_SECRET in environment variables');
  jwtLogger.error('Generate secure secrets: node -e "logger.info(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be defined in environment variables for production');
  } else {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be defined in environment variables');
  }
}

const SECRET = JWT_SECRET!;
const REFRESH_SECRET = JWT_REFRESH_SECRET!;

export interface TokenPayload {
  id: string;
  userId?: string;
  name?: string;
  email?: string;
  role: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export const signAccessToken = (payload: Omit<TokenPayload, 'jti' | 'iat' | 'exp'>): string => {
  const jti = uuidv4();
  const normalized = {
    ...payload,
    jti,
    userId: payload.userId || payload.id
  };

  const token = jwt.sign(normalized, SECRET, { expiresIn: '15m' });
  return token;
};

export const signRefreshToken = (payload: Omit<TokenPayload, 'jti' | 'iat' | 'exp'>): string => {
  const jti = uuidv4();
  const normalized = {
    ...payload,
    jti,
    userId: payload.userId || payload.id
  };

  const token = jwt.sign(normalized, REFRESH_SECRET, { expiresIn: '7d' });
  return token;
};

export const verifyToken = async (token: string, checkBlacklist: boolean = true): Promise<TokenPayload> => {
  try {
    const decoded = jwt.verify(token, SECRET) as TokenPayload;

    if (checkBlacklist && decoded.jti) {
      const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(decoded.jti);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }
    }

    return decoded;
  } catch (error) {
    jwtLogger.error('Access token verification failed', error);
    throw error;
  }
};

export const verifyRefreshToken = async (token: string, checkBlacklist: boolean = true): Promise<TokenPayload> => {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as TokenPayload;

    if (checkBlacklist && decoded.jti) {
      const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(decoded.jti);
      if (isBlacklisted) {
        throw new Error('Refresh token has been revoked');
      }
    }

    return decoded;
  } catch (error) {
    jwtLogger.error('Refresh token verification failed', error);
    throw error;
  }
};

export const decodeTokenWithoutVerification = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    jwtLogger.error('Token decode failed', error);
    return null;
  }
};
