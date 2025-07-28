import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth';
import * as userController from '../controllers/userController';

const router = Router();

// Get all teachers (accessible by students)
router.get('/teachers', auth, userController.getTeachers);

// Get all students (accessible by teachers)
router.get('/students', auth, requireRole('teacher'), userController.getStudents);

// Get current user profile
router.get('/profile', auth, userController.getCurrentUser);

// Update current user profile
router.put('/profile', auth, userController.updateCurrentUser);

export default router; 