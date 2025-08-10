import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PaymentHistoryTable from '@/components/payment/PaymentHistoryTable';
import { PaymentStats } from '@/types/payment';
import { paymentAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { 
  CreditCardIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentStats();
  }, []);

  const loadPaymentStats = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPaymentStats();
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading payment stats:', error);
      toast.error('Failed to load payment statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Convert from cents
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
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
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <CreditCardIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Payments Unavailable</h1>
          </div>
          <p className="text-gray-600">Payments are currently unavailable in your region.</p>
        </div>

        {/* Payment Statistics (optional when disabled) */}
        {false && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCardIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalPayments ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats?.totalAmount ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.completedPayments ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.failedPayments ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current subscription status */}
        {user && (user.subscriptionStatus || user.lessonTokens) && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user.subscriptionStatus && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Subscription</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {user.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                    </p>
                    {user.subscriptionType && (
                      <p className="text-sm text-gray-500">{user.subscriptionType}</p>
                    )}
                    {user.subscriptionExpiry && (
                      <p className="text-sm text-gray-500">
                        Expires: {new Date(user.subscriptionExpiry).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.subscriptionStatus === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.subscriptionStatus}
                  </div>
                </div>
              )}

              {user.lessonTokens !== undefined && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Lesson Tokens</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {user.lessonTokens} tokens
                    </p>
                    <p className="text-sm text-gray-500">
                      Available for booking lessons
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {user.lessonTokens > 0 ? 'Available' : 'None'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment History Table hidden while disabled */}

        {/* Help section */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Payment Issues</h4>
              <p className="text-sm text-gray-600 mb-2">
                If you're experiencing payment problems or need a refund, please contact our support team.
              </p>
              <a href="/support" className="text-sm text-blue-600 hover:text-blue-800">
                Contact Support →
              </a>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Account Questions</h4>
              <p className="text-sm text-gray-600 mb-2">
                Have questions about your subscription or lesson tokens? Check our FAQ or reach out to us.
              </p>
              <a href="/faq" className="text-sm text-blue-600 hover:text-blue-800">
                View FAQ →
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 