import { Router } from 'express';
import { PersonalizedCurriculumController } from '../controllers/personalizedCurriculumController';
import { auth } from '../middleware/auth';

const router = Router();

// Get user's curriculum (authenticated)
router.get('/', auth, PersonalizedCurriculumController.getCurriculum);

// Create curriculum (authenticated)
router.post('/', auth, PersonalizedCurriculumController.createCurriculum);

// Update progress (authenticated)
router.put('/progress', auth, PersonalizedCurriculumController.updateProgress);

// Get recommendations (authenticated)
router.get('/recommendations', auth, PersonalizedCurriculumController.getRecommendations);

// Update study schedule (authenticated)
router.put('/schedule', auth, PersonalizedCurriculumController.updateStudySchedule);

// Complete recommendation (authenticated)
router.put('/recommendations/:recommendationId/complete', auth, PersonalizedCurriculumController.completeRecommendation);

// Get analytics (authenticated)
router.get('/analytics', auth, PersonalizedCurriculumController.getAnalytics);

export default router; 