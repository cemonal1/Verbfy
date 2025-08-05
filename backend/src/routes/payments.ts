import express from 'express';
import { auth, requireRole } from '../middleware/auth';
import {
  createCheckoutSession,
  handleWebhook,
  getPaymentHistory,
  getProducts,
  getPaymentStats,
  refundPayment
} from '../controllers/paymentController';

const router = express.Router();

// Webhook endpoint (no auth required, uses Stripe signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes (require authentication)
router.use(auth);

// Create checkout session
router.post('/create-session', createCheckoutSession);

// Get user's payment history
router.get('/history', getPaymentHistory);

// Get available products
router.get('/products', getProducts);

// Get payment statistics
router.get('/stats', getPaymentStats);

// Admin routes (require admin role)
router.use(requireRole('admin'));

// Refund payment (admin only)
router.post('/:paymentId/refund', refundPayment);

export default router; 