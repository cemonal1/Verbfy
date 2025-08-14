import { Router } from 'express';

const router = Router();

// This route group is deprecated in favor of /api/chat
router.all('*', (_req, res) => {
  res.status(410).json({
    success: false,
    message: 'This endpoint is deprecated. Use /api/chat endpoints instead.'
  });
});

export default router; 