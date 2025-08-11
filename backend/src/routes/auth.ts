import { Router } from 'express';
import { register, login, getTeachers, refreshToken, logout, me } from '../controllers/authController';
import { oauthInit, oauthCallback } from '../controllers/oauthController';
import { verifyEmail, requestPasswordReset, resetPassword } from '../controllers/verificationController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/me', me);
router.get('/profile', me);
router.get('/teachers', getTeachers);
// Email verification & password reset
router.post('/verify-email', verifyEmail);
router.post('/password/request-reset', requestPasswordReset);
router.post('/password/reset', resetPassword);
// OAuth providers
router.get('/oauth/:provider', oauthInit);
router.get('/oauth/:provider/callback', oauthCallback);

export default router; 