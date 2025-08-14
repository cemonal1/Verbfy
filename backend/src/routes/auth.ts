import { Router } from 'express';
import { register, login, getTeachers, refreshToken, logout, me, requestEmailVerification, verifyEmail, forgotPassword, resetPassword } from '../controllers/authController';
import { passwordResetLimiter, authLimiter } from '../middleware/rateLimit';
import { oauthInit, oauthCallback } from '../controllers/oauthController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/refresh', refreshToken); // alias for clients expecting /refresh
router.post('/logout', logout);
router.get('/me', me);
router.get('/profile', me);
router.get('/teachers', getTeachers);
// OAuth providers
router.get('/oauth/:provider', oauthInit);
router.get('/oauth/:provider/callback', oauthCallback);

// Email verification
router.post('/verify-email/request', authLimiter, requestEmailVerification);
router.get('/verify-email/confirm', verifyEmail);

// Password reset
router.post('/password/forgot', passwordResetLimiter, forgotPassword);
router.post('/password/reset', passwordResetLimiter, resetPassword);

export default router; 