import express from 'express';
import { auth, requireRole } from '../middleware/auth';
import { getPaymentHistory, getProducts, getPaymentStats } from '../controllers/paymentController';

const router = express.Router();

// Webhook disabled; Stripe removed
router.post('/webhook', (_req, res) => res.status(410).json({ success: false, message: 'Payments are disabled' }));

// Protected routes (require authentication)
router.use(auth);

// Create checkout session disabled
router.post('/create-session', (_req, res) => res.status(410).json({ success: false, message: 'Payments are disabled' }));

// Get user's payment history
router.get('/history', getPaymentHistory);

// Get available products (informational; payments disabled)
router.get('/products', getProducts);

// Get payment statistics
router.get('/stats', getPaymentStats);

// Admin routes (require admin role)
router.use(requireRole('admin'));

// Refund payment (admin only) - disabled
router.post('/:paymentId/refund', (_req, res) => res.status(410).json({ success: false, message: 'Payments are disabled' }));

export default router; 