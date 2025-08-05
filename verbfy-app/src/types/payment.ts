// Payment types
export type PaymentType = 'subscription' | 'lesson_tokens' | 'one_time';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';

// Product interface
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  type: PaymentType;
  quantity?: number; // For lesson tokens
  duration?: number; // For subscriptions (in days)
  features: string[];
}

// Payment interface
export interface Payment {
  _id: string;
  user: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  product: {
    id: string;
    name: string;
    description?: string;
    quantity?: number;
    duration?: number;
  };
  metadata?: {
    lessonTokens?: number;
    subscriptionExpiry?: string;
    couponCode?: string;
    discountAmount?: number;
  };
  refundedAt?: string;
  refundedBy?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
  formattedAmount?: string;
  age?: string;
}

// Payment statistics
export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  completedAmount: number;
  failedPayments: number;
  refundedPayments: number;
}

// API Response types
export interface ProductsResponse {
  success: boolean;
  data: Product[];
  message: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  data: {
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
}

export interface PaymentStatsResponse {
  success: boolean;
  data: PaymentStats;
  message: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  data: {
    sessionId: string;
    url: string;
  };
  message: string;
}

// Request types
export interface CreateCheckoutSessionRequest {
  productId: string;
  couponCode?: string;
}

export interface RefundPaymentRequest {
  reason?: string;
}

// Utility functions
export const formatCurrency = (amount: number, currency: string = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / 100); // Stripe amounts are in cents
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'failed':
    case 'cancelled':
      return 'text-red-600 bg-red-100';
    case 'refunded':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getStatusIcon = (status: PaymentStatus): string => {
  switch (status) {
    case 'completed':
      return '✅';
    case 'pending':
      return '⏳';
    case 'failed':
      return '❌';
    case 'cancelled':
      return '🚫';
    case 'refunded':
      return '↩️';
    default:
      return '❓';
  }
};

// Product configurations (matching backend)
export const PRODUCTS: Record<string, Product> = {
  SUBSCRIPTION_MONTHLY: {
    id: 'sub_monthly',
    name: 'Monthly Subscription',
    description: 'Access to all premium features for 1 month',
    price: 2999, // $29.99 in cents
    currency: 'usd',
    type: 'subscription',
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
    type: 'subscription',
    duration: 90, // days
    features: [
      'Unlimited lesson materials',
      'Priority booking',
      'Advanced analytics',
      'Premium support',
      'Save 20% compared to monthly'
    ]
  },
  TOKENS_5: {
    id: 'tokens_5',
    name: '5 Lesson Tokens',
    description: '5 individual lesson credits',
    price: 4999, // $49.99 in cents
    currency: 'usd',
    type: 'lesson_tokens',
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
    type: 'lesson_tokens',
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
    type: 'lesson_tokens',
    quantity: 25,
    features: [
      '25 individual lessons',
      'Valid for 6 months',
      'Any lesson type',
      'Save 20% compared to 5-pack'
    ]
  }
}; 