import express from 'express';
import { LiveKitController } from '../controllers/livekitController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();
const livekitController = new LiveKitController();

// Generate token for a room
router.post(
  '/token/:roomName',
  requireAuth,
  livekitController.generateToken.bind(livekitController)
);

// Validate room access
router.get(
  '/validate/:roomName',
  requireAuth,
  livekitController.validateAccess.bind(livekitController)
);

export default router; 