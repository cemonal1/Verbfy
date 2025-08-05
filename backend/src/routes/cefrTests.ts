import { Router } from 'express';
import { CEFRTestController } from '../controllers/cefrTestController';
import { auth } from '../middleware/auth';

const router = Router();

// Get all tests (public)
router.get('/', CEFRTestController.getTests);

// Get test by ID (public)
router.get('/:id', CEFRTestController.getTest);

// Get test statistics (public)
router.get('/:id/stats', CEFRTestController.getTestStats);

// Create test (authenticated, teachers/admins only)
router.post('/', auth, CEFRTestController.createTest);

// Update test (authenticated, owner only)
router.put('/:id', auth, CEFRTestController.updateTest);

// Delete test (authenticated, owner only)
router.delete('/:id', auth, CEFRTestController.deleteTest);

// Get placement recommendation (authenticated)
router.get('/placement/recommendation', auth, CEFRTestController.getPlacementRecommendation);

// Start test attempt (authenticated)
router.post('/:testId/start', auth, CEFRTestController.startTest);

// Submit test attempt (authenticated)
router.post('/attempt/:attemptId/submit', auth, CEFRTestController.submitTest);

export default router; 