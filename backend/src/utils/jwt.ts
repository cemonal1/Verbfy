import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Check if we're in development and provide helpful error messages
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error('❌ JWT Configuration Error:');
  console.error('   JWT_SECRET and JWT_REFRESH_SECRET must be defined in environment variables');
  console.error('');
  console.error('📝 To fix this:');
  console.error('   1. Copy backend/env.example to backend/.env');
  console.error('   2. Generate secure JWT secrets:');
  console.error('      - JWT_SECRET: Use a long, random string (at least 32 characters)');
  console.error('      - JWT_REFRESH_SECRET: Use a different long, random string');
  console.error('   3. Example:');
  console.error('      JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-32-chars');
  console.error('      JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here-make-it-long-and-random-32-chars');
  console.error('');
  console.error('🔐 For production, use cryptographically secure random strings');
  console.error('   You can generate them using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.error('');
  
  // In development, we can provide a fallback, but warn the user
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Using fallback JWT secrets for development (NOT SECURE FOR PRODUCTION)');
    console.warn('   Please set proper JWT secrets in your .env file');
  } else {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be defined in environment variables');
  }
}

// Use fallback secrets for development if not provided
const SECRET = JWT_SECRET || 'dev-jwt-secret-not-for-production-use-this-only-for-development';
const REFRESH_SECRET = JWT_REFRESH_SECRET || 'dev-refresh-jwt-secret-not-for-production-use-this-only-for-development';

export const signAccessToken = (payload: any): string => {
  const token = jwt.sign(payload, SECRET, { expiresIn: '15m' });
  return token;
};

export const signRefreshToken = (payload: any): string => {
  const token = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  return token;
};

export const verifyToken = (token: string): any => {
  try {
    const decoded = jwt.verify(token, SECRET);
    return decoded;
  } catch (error) {
    throw error;
  }
};

export const verifyRefreshToken = (token: string): any => {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    return decoded;
  } catch (error) {
    throw error;
  }
}; 