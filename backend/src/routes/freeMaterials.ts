import { Router } from 'express';
import { FreeMaterialController } from '../controllers/freeMaterialController';
import { auth } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = Router();

// Get all materials (public)
router.get('/', FreeMaterialController.getMaterials);

// Get featured materials (public)
router.get('/featured', FreeMaterialController.getFeaturedMaterials);

// Get categories (public)
router.get('/categories', FreeMaterialController.getCategories);

// Get levels (public)
router.get('/levels', FreeMaterialController.getLevels);

// Get material by ID (public)
router.get('/:id', FreeMaterialController.getMaterial);

// Download material (public)
router.get('/:id/download', FreeMaterialController.downloadMaterial);

// Upload material (authenticated)
router.post('/', auth, idempotencyMiddleware, FreeMaterialController.uploadMaterial);

// Rate material (authenticated)
router.post('/:id/rate', auth, idempotencyMiddleware, FreeMaterialController.rateMaterial);

// Update material (authenticated, owner only)
router.put('/:id', auth, idempotencyMiddleware, FreeMaterialController.updateMaterial);

// Delete material (authenticated, owner only)
router.delete('/:id', auth, idempotencyMiddleware, FreeMaterialController.deleteMaterial);

export default router; 