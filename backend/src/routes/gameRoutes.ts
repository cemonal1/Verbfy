import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { listGames, createGame, deleteGame } from '../controllers/gameController';

const router = Router();

// Public list
router.get('/', listGames);

// Admin create/delete
router.post('/', auth, requireRole('admin'), idempotencyMiddleware, createGame);
router.delete('/:id', auth, requireRole('admin'), idempotencyMiddleware, deleteGame);

export default router;


