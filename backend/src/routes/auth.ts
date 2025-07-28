import { Router } from 'express';
import { register, login, getTeachers, refreshToken, logout, me } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/me', me);
router.get('/teachers', getTeachers);

export default router; 