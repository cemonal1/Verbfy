import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProductCard from '@/components/payment/ProductCard';
import { Product, PRODUCTS } from '@/types/payment';
import { paymentAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { 
  CreditCardIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function TokensPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userTokens, setUserTokens] = useState(0);

  useEffect(() => {
    loadProducts();
    checkUserTokens();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getProducts({ type: 'lesson_tokens' });
      
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        // Fallback to local products if API fails
        setProducts(Object.values(PRODUCTS).filter(p => p.type === 'lesson_tokens'));
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to local products
      setProducts(Object.values(PRODUCTS).filter(p => p.type === 'lesson_tokens'));
    } finally {
      setLoading(false);
    }
  };

  const checkUserTokens = () => {
    if (user) {
      setUserTokens(user.lessonTokens || 0);
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
            <CreditCardIcon className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Buy Lesson Tokens
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Purchase lesson credits to book individual sessions with our expert teachers
          </p>
        </div>

        {/* Current token balance */}
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <ClockIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <span className="text-lg font-semibold text-blue-900">
                    Current Balance
                  </span>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {userTokens} Tokens
                </div>
                <p className="text-sm text-blue-700">
                  {userTokens === 0 
                    ? 'You have no lesson tokens. Purchase a package to get started!'
                    : `You can book ${userTokens} lesson${userTokens !== 1 ? 's' : ''} with this balance.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Token packages */}
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

        {/* How it works */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How Lesson Tokens Work
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Purchase Tokens
              </h3>
              <p className="text-gray-600">
                Choose a token package that fits your learning needs and budget
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Book Lessons
              </h3>
              <p className="text-gray-600">
                Use your tokens to book individual lessons with any available teacher
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Learn & Improve
              </h3>
              <p className="text-gray-600">
                Attend your lessons and track your progress with detailed feedback
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gray-50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Benefits of Lesson Tokens
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Flexibility
                </h3>
                <p className="text-gray-600">
                  Book lessons whenever you want, with any available teacher, without committing to a subscription.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Cost Effective
                </h3>
                <p className="text-gray-600">
                  Save money with bulk token packages. The more tokens you buy, the better the value.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Expiration
                </h3>
                <p className="text-gray-600">
                  Tokens are valid for 6 months, giving you plenty of time to use them at your own pace.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  All Lesson Types
                </h3>
                <p className="text-gray-600">
                  Use tokens for any type of lesson: speaking, listening, reading, writing, grammar, or exam prep.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How long are tokens valid?
              </h3>
              <p className="text-gray-600">
                Lesson tokens are valid for 6 months from the date of purchase. You'll receive a reminder when they're about to expire.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I use tokens for any lesson type?
              </h3>
              <p className="text-gray-600">
                Yes! Tokens can be used for any lesson type: speaking, listening, reading, writing, grammar, or exam preparation.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What if I don't use all my tokens?
              </h3>
              <p className="text-gray-600">
                Unused tokens expire after 6 months. We recommend using them regularly to maximize your learning progress.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I gift tokens to someone else?
              </h3>
              <p className="text-gray-600">
                Currently, tokens are tied to your account. We're working on a gifting feature for future releases.
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