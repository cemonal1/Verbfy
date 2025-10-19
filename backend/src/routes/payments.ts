import express from 'express';
import { auth } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { getPaymentHistory, getProducts, getPaymentStats, createCheckoutSession } from '../controllers/paymentController';

const router = express.Router();

// Previously disabled endpoints: enable create-session and keep refund disabled until policy review
router.post('/create-session', auth, idempotencyMiddleware, createCheckoutSession);

// Read-only endpoints remain
router.get('/history', auth, getPaymentHistory);
router.get('/products', getProducts);
router.get('/stats', auth, getPaymentStats);

// Refund route still disabled intentionally; requires admin flow and Stripe integration
router.post('/:paymentId/refund', (_req, res) => {
  res.status(410).json({ success: false, message: 'Refund endpoint temporarily disabled' });
});

export default router;