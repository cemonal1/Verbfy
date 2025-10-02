import { Request, Response } from 'express';
import { Payment } from '../models/Payment';

// Payments are disabled. Keep read-only endpoints operational for history and product catalog if present.

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
  // Informational product catalog (payments are disabled). Used by frontend to render pricing.
  // Currency: TRY, Monthly membership: ₺980. VerbfyToken: 1 token = 25 minutes 1v1 lesson.
  const catalog = [
    {
      id: 'membership-monthly',
      name: 'Monthly Membership',
      priceText: '₺980',
      price: 980,
      currency: 'TRY',
      period: '/month',
      features: [
        'Unlimited platform access',
        'All free materials',
        'Community features',
        'Includes 1 VerbfyToken (25 min 1:1 lesson)',
      ],
      badge: '1 Token Gift',
      popular: false,
    },
    {
      id: 'membership-yearly',
      name: 'Yearly Membership',
      priceText: '₺9800',
      price: 9800,
      currency: 'TRY',
      period: '/year',
      features: [
        'Everything in Monthly',
        'Priority support',
        'Includes 12 VerbfyTokens (12×25 min 1:1 lessons)',
      ],
      badge: 'Best Value • 12 Tokens Gift',
      popular: true,
    },
    {
      id: 'verbfytoken-info',
      name: 'VerbfyToken (Add-on)',
      priceText: '1 Token = 25 min One-to-one Private Lesson',
      currency: 'TRY',
      period: '',
      features: [
        'Spend 1 token per 25-minute 1:1 lesson',
        'Token bundles available to active subscribers',
        'Purchase flow will be enabled after subscription',
      ],
      postSubscriptionOnly: true,
      popular: false,
    },
  ];

  res.json({ success: true, data: catalog, message: 'Product catalog' });
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


