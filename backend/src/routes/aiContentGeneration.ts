import { Router } from 'express';
import { AIContentGenerationController } from '../controllers/aiContentGenerationController';
import { auth } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = Router();

// Generate new content (authenticated)
router.post('/generate', auth, idempotencyMiddleware, AIContentGenerationController.generateContent);

// Get user's generated content (authenticated)
router.get('/', auth, AIContentGenerationController.getUserContent);

// Get content by ID (authenticated)
router.get('/:id', auth, AIContentGenerationController.getContentById);

// Update content quality assessment (authenticated)
router.put('/:id/quality', auth, idempotencyMiddleware, AIContentGenerationController.updateQualityAssessment);

// Approve content (authenticated, admin/teacher only)
router.put('/:id/approve', auth, idempotencyMiddleware, AIContentGenerationController.approveContent);

// Get content analytics (authenticated)
router.get('/analytics/overview', auth, AIContentGenerationController.getContentAnalytics);

export default router; 