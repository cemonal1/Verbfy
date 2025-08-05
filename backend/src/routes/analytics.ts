import express from 'express';
import { auth } from '../middleware/auth';
import {
  getTeacherAnalytics,
  getStudentAnalytics,
  getAdminAnalytics
} from '../controllers/analyticsController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Teacher analytics - only accessible by teachers
router.get('/teacher', getTeacherAnalytics);

// Student analytics - only accessible by students
router.get('/student', getStudentAnalytics);

// Admin analytics - only accessible by admins
router.get('/admin', getAdminAnalytics);

export default router; 