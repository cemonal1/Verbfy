import { Router } from 'express';
import { FreeMaterialController } from '../controllers/freeMaterialController';
import { auth } from '../middleware/auth';

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
router.post('/', auth, FreeMaterialController.uploadMaterial);

// Rate material (authenticated)
router.post('/:id/rate', auth, FreeMaterialController.rateMaterial);

// Update material (authenticated, owner only)
router.put('/:id', auth, FreeMaterialController.updateMaterial);

// Delete material (authenticated, owner only)
router.delete('/:id', auth, FreeMaterialController.deleteMaterial);

export default router; 