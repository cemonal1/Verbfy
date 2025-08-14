import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';
import * as chatController from '../controllers/chatController';

const router = Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get all conversations for the current user (students and teachers only)
router.get('/conversations',
  requireRole(['student', 'teacher']),
  chatController.getConversations
);

// Get or create a conversation with another user (students and teachers only)
router.get('/conversations/user/:otherUserId',
  requireRole(['student', 'teacher']),
  chatController.getOrCreateConversation
);

// Get messages for a conversation (students and teachers only)
router.get('/conversations/:conversationId/messages',
  requireRole(['student', 'teacher']),
  chatController.getMessages
);

// Send a message (students and teachers only)
router.post('/messages',
  requireRole(['student', 'teacher']),
  idempotencyMiddleware,
  chatController.sendMessage
);

// Mark messages as read (students and teachers only)
router.patch('/conversations/:conversationId/read',
  requireRole(['student', 'teacher']),
  idempotencyMiddleware,
  chatController.markAsRead
);

// Get unread message count (students and teachers only)
router.get('/unread-count',
  requireRole(['student', 'teacher']),
  chatController.getUnreadCount
);

export default router; 