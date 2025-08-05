import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProductCard from '@/components/payment/ProductCard';
import { Product, PRODUCTS } from '@/types/payment';
import { paymentAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { 
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function SubscribePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<any>(null);

  useEffect(() => {
    loadProducts();
    checkUserSubscription();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getProducts({ type: 'subscription' });
      
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        // Fallback to local products if API fails
        setProducts(Object.values(PRODUCTS).filter(p => p.type === 'subscription'));
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to local products
      setProducts(Object.values(PRODUCTS).filter(p => p.type === 'subscription'));
    } finally {
      setLoading(false);
    }
  };

  const checkUserSubscription = () => {
    if (user) {
      setUserSubscription({
        status: user.subscriptionStatus,
        type: user.subscriptionType,
        expiry: user.subscriptionExpiry
      });
    }
  };

  const handlePurchase = () => {
    toast.success('Redirecting to secure checkout...');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <SparklesIcon className="h-12 w-12 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Subscription
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock premium features and accelerate your English learning journey
          </p>
        </div>

        {/* Current subscription status */}
        {userSubscription && userSubscription.status === 'active' && (
          <div className="mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    Active Subscription
                  </h3>
                  <p className="text-sm text-green-700">
                    You currently have an active {userSubscription.type} subscription
                    {userSubscription.expiry && (
                      <span> until {new Date(userSubscription.expiry).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPurchase={handlePurchase}
              className="h-full"
            />
          ))}
        </div>

        {/* Features comparison */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What's Included in Premium
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <SparklesIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unlimited Materials
              </h3>
              <p className="text-gray-600">
                Access to all premium lesson materials, exercises, and resources
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircleIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Priority Booking
              </h3>
              <p className="text-gray-600">
                Get priority access to book lessons with top-rated teachers
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Advanced Analytics
              </h3>
              <p className="text-gray-600">
                Detailed progress tracking and personalized learning insights
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel my subscription?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                We offer a 7-day free trial for new subscribers. You can cancel anytime during the trial period.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, and digital wallets through our secure Stripe payment system.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-gray-600">
                Yes, you can change your subscription plan at any time. Changes will take effect at the start of your next billing cycle.
              </p>
            </div>
          </div>
        </div>

        {/* Security notice */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            🔒 All payments are processed securely by Stripe. Your payment information is never stored on our servers.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
} 