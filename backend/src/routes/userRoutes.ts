import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { auth, requireRole } from '../middleware/auth';
import * as userController from '../controllers/userController';
import { userDataCache, shortCache } from '../middleware/cacheMiddleware';

const router = Router();

// Configure multer for avatar uploads
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `avatar-${unique}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(null, false);
  }
});

// Get all teachers (accessible by students)
router.get('/teachers', auth, shortCache, userController.getTeachers);

// Get all students (accessible by teachers)
router.get('/students', auth, requireRole('teacher'), shortCache, userController.getStudents);

// Admin: list all users
router.get('/', auth, requireRole('admin'), userController.getAllUsers);

// Get current user profile
router.get('/profile', auth, userDataCache, userController.getCurrentUser);

// Update current user profile
router.put('/profile', auth, userController.updateCurrentUser);

// Upload avatar
router.post('/profile/avatar', auth, upload.single('avatar'), userController.uploadAvatar);

// S3 presigned upload URL for teacher documents
router.get('/uploads/presign', auth, userController.getPresignedUploadUrl);

export default router;