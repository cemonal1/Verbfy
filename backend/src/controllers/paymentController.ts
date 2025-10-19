import { Request, Response } from 'express';
import { Payment } from '../models/Payment';
import { stripe, createCheckoutSessionOptions, verifyWebhookSignature, getProduct, getAllProducts, formatAmount } from '../lib/stripe';
import { saveIdempotentResponse } from '../middleware/idempotency';

// Ödemeler Stripe yapılandırmasına göre devreye alınır. Stripe yoksa, yalnızca okuma uçları çalışır.

export const getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await Payment.getUserPayments(userId, pageNum, limitNum);

    res.json({ success: true, data: result, message: 'Payment history retrieved successfully' });
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve payment history' });
  }
};

export const getProducts = async (_req: Request, res: Response) => {
  // Sunucu tarafındaki Stripe ürün kataloğunu döndür (abonelik ve token paketleri).
  const products = getAllProducts().map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    currency: p.currency,
    type: p.type,
    quantity: (p as any).quantity,
    duration: (p as any).duration,
    features: p.features,
    displayPrice: formatAmount(p.price, p.currency)
  }));

  res.json({ success: true, data: products, message: 'Product catalog' });
  return;
};

export const getPaymentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const stats = await Payment.getPaymentStats(userId);
    res.json({ success: true, data: stats, message: 'Payment statistics retrieved successfully' });
  } catch (error) {
    console.error('Error getting payment stats:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve payment statistics' });
  }
};

// Create Stripe Checkout Session
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { productId, couponCode } = req.body || {};

    if (!userId) {
      const payload = { success: false, message: 'Authentication required' };
      await saveIdempotentResponse(req, res, payload, 401);
      res.status(401).json(payload);
      return;
    }

    if (!stripe) {
      const payload = { success: false, message: 'Payment processor not configured' };
      await saveIdempotentResponse(req, res, payload, 503);
      res.status(503).json(payload);
      return;
    }

    if (!productId) {
      const payload = { success: false, message: 'Missing productId' };
      await saveIdempotentResponse(req, res, payload, 400);
      res.status(400).json(payload);
      return;
    }

    const product = getProduct(productId);
    if (!product) {
      const payload = { success: false, message: 'Invalid productId' };
      await saveIdempotentResponse(req, res, payload, 400);
      res.status(400).json(payload);
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/payment/cancel`;

    const options = createCheckoutSessionOptions(productId, userId, successUrl, cancelUrl);

    // Optional coupon support
    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      // Stripe will validate coupon code server-side; if invalid, it will error
      (options as any).discounts = [{ coupon: couponCode.trim() }];
    }

    // Allow customers to enter promotion codes at checkout
    (options as any).allow_promotion_codes = true;

    const session = await stripe.checkout.sessions.create(options);

    // Record pending payment
    await Payment.create({
      user: userId,
      type: product.type,
      amount: product.price, // cents
      currency: product.currency,
      status: 'pending',
      stripeSessionId: session.id,
      product: {
        id: productId,
        name: product.name,
        description: product.description,
        quantity: (product as any).quantity,
        duration: (product as any).duration
      },
      metadata: {
        couponCode: couponCode || undefined
      }
    });

    const payload = { success: true, data: { checkoutSessionId: session.id, url: session.url } };
    await saveIdempotentResponse(req, res, payload, 200);
    res.status(200).json(payload);
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    const payload = { success: false, message: error?.message || 'Failed to create checkout session' };
    await saveIdempotentResponse(req, res, payload, 500);
    res.status(500).json(payload);
  }
};

// Stripe Webhook Handler (expects raw body)
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!stripe) {
      res.status(503).json({ success: false, message: 'Payment processor not configured' });
      return;
    }

    const sig = (req.headers['stripe-signature'] as string) || (req.headers['Stripe-Signature'] as any);
    if (!sig) {
      res.status(400).json({ success: false, message: 'Missing Stripe signature' });
      return;
    }

    // req.body is Buffer due to express.raw on this route
    const event = verifyWebhookSignature(req.body as any, sig);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const sessionId = session.id as string;
        const paymentIntentId = (typeof session.payment_intent === 'string') ? session.payment_intent : session.payment_intent?.id;
        const amountTotal = session.amount_total;

        const payment = await Payment.findOne({ stripeSessionId: sessionId });
        if (payment) {
          payment.status = 'completed';
          if (paymentIntentId) payment.stripePaymentIntentId = paymentIntentId;
          if (typeof amountTotal === 'number') payment.amount = amountTotal;
          await payment.save();
        }
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as any;
        const sessionId = session.id as string;
        await Payment.findOneAndUpdate({ stripeSessionId: sessionId }, { status: 'failed' });
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as any;
        const intentId = intent.id as string;
        await Payment.findOneAndUpdate({ stripePaymentIntentId: intentId }, { status: 'failed' });
        break;
      }
      default: {
        // Unhandled event type; acknowledge
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ success: false, message: error?.message || 'Webhook handling failed' });
  }
};


