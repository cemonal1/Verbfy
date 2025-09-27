import { Router } from 'express';
import { VerbfyTalkController } from '../controllers/verbfyTalkController';
import { auth } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = Router();

// Get all available rooms
router.get('/', VerbfyTalkController.getRooms);

// Get user's rooms
router.get('/my-rooms', auth, VerbfyTalkController.getUserRooms);

// Create a new room
router.post('/', auth, idempotencyMiddleware, VerbfyTalkController.createRoom);

// Get room details
router.get('/:roomId', auth, VerbfyTalkController.getRoomDetails);

// Join a room
router.post('/:roomId/join', auth, idempotencyMiddleware, VerbfyTalkController.joinRoom);

// Leave a room
router.post('/:roomId/leave', auth, idempotencyMiddleware, VerbfyTalkController.leaveRoom);

// Update room (only by creator)
router.put('/:roomId', auth, idempotencyMiddleware, VerbfyTalkController.updateRoom);

// Delete room (only by creator)
router.delete('/:roomId', auth, idempotencyMiddleware, VerbfyTalkController.deleteRoom);

export default router; 