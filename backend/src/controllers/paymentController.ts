import { Request, Response } from 'express';
import { stripe, createCheckoutSessionOptions, getProduct, getAllProducts, getProductsByType } from '../lib/stripe';
import { Payment } from '../models/Payment';
import User from '../models/User';
import { Notification } from '../models/Notification';

// Create Stripe checkout session
export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    // Stripe disabled: region not supported
    return res.status(503).json({
      success: false,
      message: 'Payments are currently unavailable in your region.'
    });

    const userId = (req as any).user.id;
    const { productId, couponCode } = req.body;

    // Validate product ID
    const product = getProduct(productId);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Check if user already has an active subscription (for subscription products)
    if (product.type === 'subscription') {
      const existingSubscription = await Payment.findOne({
        user: userId,
        type: 'subscription',
        status: 'completed',
        'metadata.subscriptionExpiry': { $gt: new Date() }
      });

      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active subscription'
        });
      }
    }

    // Create success and cancel URLs
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/payment/cancel`;

    // Create checkout session options
    const sessionOptions = createCheckoutSessionOptions(
      productId,
      userId,
      successUrl,
      cancelUrl
    );

    // Apply coupon if provided
    if (couponCode) {
      // Coupon handling disabled while payments are unavailable
    }

    // Create Stripe checkout session
    // Unreachable while payments disabled
    // Keeping structure for future enablement
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session'
    });
  }
};

// Handle Stripe webhook
export const handleWebhook = async (req: Request, res: Response) => {
  // Stripe disabled: region not supported
  return res.status(503).json({ success: false, message: 'Payments are currently unavailable in your region.' });

  // Unreachable while payments disabled
};

// Handle successful checkout session
const handleCheckoutSessionCompleted = async (session: any) => {
  const { userId, productId, productType } = session.metadata;
  
  // Update payment status
  const payment = await Payment.findOneAndUpdate(
    { stripeSessionId: session.id },
    { 
      status: 'completed',
      stripePaymentIntentId: session.payment_intent
    },
    { new: true }
  );

  if (!payment) {
    console.error('Payment not found for session:', session.id);
    return;
  }

  // Update user based on product type
  const user = await User.findById(userId);
  if (!user) {
    console.error('User not found:', userId);
    return;
  }

  if (productType === 'subscription') {
    // Update user subscription
    const product = getProduct(productId);
    const expiryDate = new Date(Date.now() + (product as any).duration * 24 * 60 * 60 * 1000);
    
    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: 'active',
      subscriptionExpiry: expiryDate,
      subscriptionType: productId
    });

    // Send notification
    await Notification.createNotification({
      recipient: userId,
      type: 'payment',
      title: 'Subscription Activated',
      body: `Your ${product!.name} has been activated successfully!`,
      link: '/dashboard',
      meta: { 
        paymentId: payment._id,
        productType: 'subscription',
        expiryDate
      }
    });
  } else if (productType === 'lesson_tokens') {
    // Add lesson tokens to user
    const product = getProduct(productId);
    const currentTokens = user.lessonTokens || 0;
    const newTokens = currentTokens + (product as any).quantity;
    
    await User.findByIdAndUpdate(userId, {
      lessonTokens: newTokens
    });

    // Send notification
    await Notification.createNotification({
      recipient: userId,
      type: 'payment',
      title: 'Lesson Tokens Added',
      body: `${(product as any).quantity} lesson tokens have been added to your account!`,
      link: '/dashboard',
      meta: { 
        paymentId: payment._id,
        productType: 'lesson_tokens',
        tokensAdded: (product as any).quantity
      }
    });
  }
};

// Handle expired checkout session
const handleCheckoutSessionExpired = async (session: any) => {
  await Payment.findOneAndUpdate(
    { stripeSessionId: session.id },
    { status: 'cancelled' }
  );
};

// Handle failed payment
const handlePaymentFailed = async (paymentIntent: any) => {
  await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntent.id },
    { status: 'failed' }
  );
};

// Get user's payment history
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await Payment.getUserPayments(userId, pageNum, limitNum);

    res.json({
      success: true,
      data: result,
      message: 'Payment history retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment history'
    });
  }
};

// Get available products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    let products;
    if (type === 'subscription') {
      products = getProductsByType('subscription');
    } else if (type === 'lesson_tokens') {
      products = getProductsByType('lesson_tokens');
    } else {
      products = getAllProducts();
    }

    res.json({
      success: true,
      data: products,
      message: 'Products retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products'
    });
  }
};

// Get payment statistics
export const getPaymentStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const stats = await Payment.getPaymentStats(userId);

    res.json({
      success: true,
      data: stats,
      message: 'Payment statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment statistics'
    });
  }
};

// Refund payment (admin only)
export const refundPayment = async (req: Request, res: Response) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Payment system is not configured. Please contact support.'
      });
    }

    const { paymentId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.id;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if payment can be refunded
    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment cannot be refunded'
      });
    }

    // Process refund through Stripe
    if (payment.stripePaymentIntentId) {
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        reason: 'requested_by_customer'
      });

      // Update payment status
      await (payment as any).markAsRefunded(adminId, reason);

      // Update user based on product type
      const user = await User.findById(payment.user);
      if (user) {
        if (payment.type === 'subscription') {
          await User.findByIdAndUpdate(payment.user, {
            subscriptionStatus: 'inactive',
            subscriptionExpiry: new Date()
          });
        } else if (payment.type === 'lesson_tokens') {
          const tokensToRemove = payment.metadata?.lessonTokens || 0;
          const currentTokens = user.lessonTokens || 0;
          const newTokens = Math.max(0, currentTokens - tokensToRemove);
          
          await User.findByIdAndUpdate(payment.user, {
            lessonTokens: newTokens
          });
        }
      }

      // Send notification to user
      await Notification.createNotification({
        recipient: payment.user.toString(),
        type: 'payment',
        title: 'Payment Refunded',
        body: `Your payment for ${payment.product.name} has been refunded${reason ? `: ${reason}` : ''}`,
        link: '/payment/history',
        meta: { 
          paymentId: payment._id,
          refundAmount: payment.amount,
          reason
        }
      });

      res.json({
        success: true,
        data: { refund },
        message: 'Payment refunded successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment intent not found'
      });
    }
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refund payment'
    });
  }
}; 