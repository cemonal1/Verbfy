import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const { session_id } = router.query;

  useEffect(() => {
    if (session_id) {
      // Refresh user data to get updated subscription/token status
      refreshUser().finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [session_id, refreshUser]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>

          {/* Session ID */}
          {session_id && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Transaction ID:</span> {session_id}
              </p>
            </div>
          )}

          {/* Updated Status */}
          {user && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Your Updated Status
              </h2>
              
              {user.subscriptionStatus === 'active' && (
                <div className="flex items-center justify-center mb-4">
                  <SparklesIcon className="h-6 w-6 text-purple-600 mr-2" />
                  <span className="text-lg font-medium text-gray-900">
                    Active Subscription
                  </span>
                </div>
              )}
              
              {user.lessonTokens && user.lessonTokens > 0 && (
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Lesson Tokens Available
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {user.lessonTokens} tokens
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What's Next?
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  1
                </span>
                <p className="text-gray-700">
                  You'll receive a confirmation email with your receipt
                </p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  2
                </span>
                <p className="text-gray-700">
                  Your account has been updated with your new features
                </p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  3
                </span>
                <p className="text-gray-700">
                  Start using your new features right away!
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/payment/history"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              View Payment History
            </Link>
          </div>

          {/* Support */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@verbfy.com" className="text-blue-600 hover:text-blue-800">
                support@verbfy.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 