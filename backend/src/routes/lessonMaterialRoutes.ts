import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth';
import * as lessonMaterialController from '../controllers/lessonMaterialController';

const router = Router();

// Upload a new material (teachers only)
router.post('/upload', auth, requireRole('teacher'), lessonMaterialController.uploadMaterial);

// Get teacher's own materials
router.get('/my-materials', auth, requireRole('teacher'), lessonMaterialController.getTeacherMaterials);

// Get public materials (all authenticated users)
router.get('/public', auth, lessonMaterialController.getPublicMaterials);

// Get specific material by ID
router.get('/:materialId', auth, lessonMaterialController.getMaterialById);

// Update material (owner only)
router.put('/:materialId', auth, lessonMaterialController.updateMaterial);

// Delete material (owner only)
router.delete('/:materialId', auth, lessonMaterialController.deleteMaterial);

export default router; 