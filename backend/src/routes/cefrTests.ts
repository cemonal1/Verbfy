import { Router } from 'express';
import { CEFRTestController } from '../controllers/cefrTestController';
import { auth, requireRole } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = Router();

// Get all tests (public)
router.get('/', CEFRTestController.getTests);

// Get test by ID (public)
router.get('/:id', CEFRTestController.getTest);

// Get test statistics (public)
router.get('/:id/stats', CEFRTestController.getTestStats);

// Create test (authenticated, teachers/admins only)
router.post('/', auth, idempotencyMiddleware, CEFRTestController.createTest);

// Update test (authenticated, owner only)
router.put('/:id', auth, idempotencyMiddleware, CEFRTestController.updateTest);

// Delete test (authenticated, owner only)
router.delete('/:id', auth, idempotencyMiddleware, CEFRTestController.deleteTest);

// Get placement recommendation (authenticated)
router.get('/placement/recommendation', auth, CEFRTestController.getPlacementRecommendation);

// Start test attempt (authenticated)
router.post('/:testId/start', auth, idempotencyMiddleware, CEFRTestController.startTest);

// Submit test attempt (authenticated)
router.post('/attempt/:attemptId/submit', auth, idempotencyMiddleware, CEFRTestController.submitTest);

// Seed 50Q Global Placement (admin only)
router.post('/seed/global-placement', auth, requireRole('admin'), CEFRTestController.seedGlobalPlacementTest);

// Seed Kids A1–B1 (admin only)
router.post('/seed/kids-a1-b1', auth, requireRole('admin'), CEFRTestController.seedKidsPlacementA1B1);

// Seed Adults A1–B2 (admin only)
router.post('/seed/adults-a1-b2', auth, requireRole('admin'), CEFRTestController.seedAdultsPlacementA1B2);

// Seed Advanced B1–C2 (admin only)
router.post('/seed/advanced-b1-c2', auth, requireRole('admin'), CEFRTestController.seedAdvancedPlacementB1C2);

// Admin-only bootstrap endpoints (disabled in production for safety)
if (process.env.NODE_ENV !== 'production') {
  router.post('/seed/bootstrap-public', CEFRTestController.bootstrapPublicSeeds);
  router.get('/seed/bootstrap-public', CEFRTestController.bootstrapPublicSeeds);
  router.get('/placement/all', CEFRTestController.listOrSeedPlacement);
}

export default router; 