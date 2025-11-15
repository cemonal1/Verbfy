import Stripe from 'stripe';
import { createLogger } from '../utils/logger';
const stripeLogger = createLogger('Stripe');

// Initialize Stripe with secret key (only if available)
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // Use Stripe's default API version configured on the account
    typescript: true,
  });
} else {
  stripeLogger.warn('⚠️  STRIPE_SECRET_KEY not found. Payment features will be disabled.');
}

export { stripe };

// Product configurations
export const PRODUCTS = {
  // Subscription products
  SUBSCRIPTION_MONTHLY: {
    id: 'sub_monthly',
    name: 'Monthly Subscription',
    description: 'Access to all premium features for 1 month',
    price: 2999, // $29.99 in cents
    currency: 'usd',
    type: 'subscription' as const,
    duration: 30, // days
    features: [
      'Unlimited lesson materials',
      'Priority booking',
      'Advanced analytics',
      'Premium support'
    ]
  },
  SUBSCRIPTION_QUARTERLY: {
    id: 'sub_quarterly',
    name: 'Quarterly Subscription',
    description: 'Access to all premium features for 3 months',
    price: 7999, // $79.99 in cents
    currency: 'usd',
    type: 'subscription' as const,
    duration: 90, // days
    features: [
      'Unlimited lesson materials',
      'Priority booking',
      'Advanced analytics',
      'Premium support',
      'Save 20% compared to monthly'
    ]
  },
  
  // Lesson token products
  TOKENS_5: {
    id: 'tokens_5',
    name: '5 Lesson Tokens',
    description: '5 individual lesson credits',
    price: 4999, // $49.99 in cents
    currency: 'usd',
    type: 'lesson_tokens' as const,
    quantity: 5,
    features: [
      '5 individual lessons',
      'Valid for 6 months',
      'Any lesson type'
    ]
  },
  TOKENS_10: {
    id: 'tokens_10',
    name: '10 Lesson Tokens',
    description: '10 individual lesson credits',
    price: 8999, // $89.99 in cents
    currency: 'usd',
    type: 'lesson_tokens' as const,
    quantity: 10,
    features: [
      '10 individual lessons',
      'Valid for 6 months',
      'Any lesson type',
      'Save 10% compared to 5-pack'
    ]
  },
  TOKENS_25: {
    id: 'tokens_25',
    name: '25 Lesson Tokens',
    description: '25 individual lesson credits',
    price: 19999, // $199.99 in cents
    currency: 'usd',
    type: 'lesson_tokens' as const,
    quantity: 25,
    features: [
      '25 individual lessons',
      'Valid for 6 months',
      'Any lesson type',
      'Save 20% compared to 5-pack'
    ]
  }
};

// Stripe checkout session options
export const createCheckoutSessionOptions = (
  productId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
) => {
  const product = PRODUCTS[productId as keyof typeof PRODUCTS];
  
  if (!product) {
    throw new Error(`Invalid product ID: ${productId}`);
  }

  const baseOptions: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      userId,
      productId,
      productType: product.type
    },
    line_items: [
      {
        price_data: {
          currency: product.currency,
          product_data: {
            name: product.name,
            description: product.description,
            metadata: {
              productId,
              productType: product.type,
              quantity: (product as any).quantity?.toString() || '',
              duration: (product as any).duration?.toString() || ''
            }
          },
          unit_amount: product.price,
        },
        quantity: 1,
      },
    ],
  };

  return baseOptions;
};

// Verify Stripe webhook signature
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string
): Stripe.Event => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY.');
  }
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }
  
  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error}`);
  }
};

// Get product by ID
export const getProduct = (productId: string) => {
  return PRODUCTS[productId as keyof typeof PRODUCTS];
};

// Get all products
export const getAllProducts = () => {
  return Object.values(PRODUCTS);
};

// Get products by type
export const getProductsByType = (type: 'subscription' | 'lesson_tokens') => {
  return Object.values(PRODUCTS).filter(product => product.type === type);
};

// Format amount for display
export const formatAmount = (amount: number, currency: string = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / 100);
};

// Validate coupon code (placeholder for future implementation)
export const validateCoupon = async (couponCode: string) => {
  if (!stripe) {
    return {
      valid: false,
      error: 'Stripe is not configured'
    };
  }
  
  try {
    const coupon = await stripe.coupons.retrieve(couponCode);
    return {
      valid: true,
      coupon,
      discount: coupon.percent_off || coupon.amount_off
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid coupon code'
    };
  }
}; 