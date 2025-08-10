import { Router } from 'express';
import { register, login, getTeachers, refreshToken, logout, me } from '../controllers/authController';
import { oauthInit, oauthCallback } from '../controllers/oauthController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/me', me);
router.get('/profile', me);
router.get('/teachers', getTeachers);
// OAuth providers
router.get('/oauth/:provider', oauthInit);
router.get('/oauth/:provider/callback', oauthCallback);

export default router; 