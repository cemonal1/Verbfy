import { Router } from 'express';
import { 
  createAISession, 
  getUserAISessions, 
  getAISessionAnalytics, 
  getAIResponse, 
  updateSessionProgress, 
  generateRecommendations 
} from '../controllers/aiLearningController';
import { auth } from '../middleware/auth';

const router = Router();

// Create AI learning session (authenticated)
router.post('/sessions', auth, createAISession);

// Get user's AI sessions (authenticated)
router.get('/sessions', auth, getUserAISessions);

// Get session analytics (authenticated)
router.get('/sessions/analytics', auth, getAISessionAnalytics);

// Get AI response (authenticated)
router.post('/response', auth, getAIResponse);

// Update session progress (authenticated)
router.put('/sessions/:sessionId/progress', auth, updateSessionProgress);

// Generate recommendations (authenticated)
router.post('/recommendations', auth, generateRecommendations);

export default router; 