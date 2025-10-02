import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { auth, requireRole } from '../middleware/auth';
import * as materialsController from '../controllers/materialsController';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/materials');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, extension);
    const uniqueName = `${nameWithoutExt}_${timestamp}_${random}${extension}`;
    cb(null, uniqueName);
  }
});

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimeTypes = [
    // PDFs
    'application/pdf',
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Videos
    'video/mp4', 'video/webm', 'video/ogg', 'video/avi',
    // Documents
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only allow 1 file per request
  }
});

// Error handling middleware for multer
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the limit of 50MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded'
      });
    }
  }
  
  if (err.message === 'File type not allowed') {
    return res.status(400).json({
      success: false,
      message: 'File type not allowed. Supported types: PDF, Images, Videos, Documents, Audio'
    });
  }

  next(err);
};

// Apply authentication middleware to all routes
router.use(auth);

// Upload material (teachers and admins only)
router.post('/upload', 
  requireRole(['teacher', 'admin']),
  idempotencyMiddleware,
  upload.single('file'),
  handleMulterError,
  materialsController.uploadMaterial
);

// Get all materials with filters
router.get('/', materialsController.getMaterials);

// Get user's own materials
router.get('/my-materials', materialsController.getMyMaterials);

// Get specific material by ID
router.get('/:id', materialsController.getMaterialById);

// Preview material file
router.get('/:id/preview', materialsController.previewMaterial);

// Download material file
router.get('/:id/download', materialsController.downloadMaterial);

// Update material (owner or admin only)
router.put('/:id', idempotencyMiddleware, materialsController.updateMaterial);

// Delete material (owner or admin only)
router.delete('/:id', idempotencyMiddleware, materialsController.deleteMaterial);

export default router; 