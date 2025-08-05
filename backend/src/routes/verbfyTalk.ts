import { Router } from 'express';
import { VerbfyTalkController } from '../controllers/verbfyTalkController';
import { auth } from '../middleware/auth';

const router = Router();

// Get all available rooms
router.get('/', VerbfyTalkController.getRooms);

// Get user's rooms
router.get('/my-rooms', auth, VerbfyTalkController.getUserRooms);

// Create a new room
router.post('/', auth, VerbfyTalkController.createRoom);

// Get room details
router.get('/:roomId', auth, VerbfyTalkController.getRoomDetails);

// Join a room
router.post('/:roomId/join', auth, VerbfyTalkController.joinRoom);

// Leave a room
router.post('/:roomId/leave', auth, VerbfyTalkController.leaveRoom);

// Update room (only by creator)
router.put('/:roomId', auth, VerbfyTalkController.updateRoom);

// Delete room (only by creator)
router.delete('/:roomId', auth, VerbfyTalkController.deleteRoom);

export default router; 