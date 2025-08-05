import { Router } from 'express';
import { TeacherAnalyticsController } from '../controllers/teacherAnalyticsController';
import { auth } from '../middleware/auth';

const router = Router();

// Generate analytics (authenticated, teachers only)
router.post('/generate', auth, TeacherAnalyticsController.generateTeacherAnalytics);

// Get teacher analytics (authenticated, teachers only)
router.get('/', auth, TeacherAnalyticsController.getTeacherAnalytics);

// Get student performance (authenticated, teachers only)
router.get('/student-performance', auth, TeacherAnalyticsController.getStudentPerformance);

// Get lesson analytics (authenticated, teachers only)
router.get('/lesson-analytics', auth, TeacherAnalyticsController.getLessonAnalytics);

// Get engagement metrics (authenticated, teachers only)
router.get('/engagement', auth, TeacherAnalyticsController.getEngagementMetrics);

export default router; 