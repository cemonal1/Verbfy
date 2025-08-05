import { Router } from 'express';
import { LiveKitController } from '../controllers/livekitController';
import { auth } from '../middleware/auth';

const router = Router();
const controller = new LiveKitController();

// Generate token for a room
router.post('/token/:roomName', auth, async (req, res) => {
  await controller.generateToken(req, res);
});

// Validate room access
router.get('/validate/:roomName', auth, async (req, res) => {
  await controller.validateAccess(req, res);
});

export default router; 