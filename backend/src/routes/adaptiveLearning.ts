import { Router } from 'express';
import { 
  getAdaptivePaths,
  createAdaptivePath,
  getCurrentRecommendations,
  updatePathProgress,
  getPathAnalytics
} from '../controllers/adaptiveLearningController';
import { auth } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = Router();

// Get all adaptive learning paths for the authenticated user
router.get('/paths', auth, getAdaptivePaths);

// Create a new adaptive learning path
router.post('/paths', auth, idempotencyMiddleware, createAdaptivePath);

// Get current recommendations for the user's active path
router.get('/paths/current/recommendations', auth, getCurrentRecommendations);

// Update progress for a specific path and module
router.put('/paths/:pathId/progress', auth, idempotencyMiddleware, updatePathProgress);

// Get analytics for a specific path
router.get('/paths/:pathId/analytics', auth, getPathAnalytics);

export default router;