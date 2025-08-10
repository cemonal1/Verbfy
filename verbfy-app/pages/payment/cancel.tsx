import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { XCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Cancel Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <XCircleIcon className="h-8 w-8 text-red-600" />
          </div>

          {/* Cancel Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payments Unavailable</h1>
          <p className="text-lg text-gray-600 mb-8">Payments are currently unavailable in your region.</p>

          {/* Information */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              What happened?
            </h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  ✓
                </span>
                <p className="text-gray-700">
                  Your payment was cancelled before completion
                </p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  ✓
                </span>
                <p className="text-gray-700">
                  No charges were made to your payment method
                </p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  ✓
                </span>
                <p className="text-gray-700">
                  You can try again anytime
                </p>
              </div>
            </div>
          </div>

          {/* Common Reasons */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Common Reasons for Cancellation
            </h3>
            <div className="space-y-2 text-left">
              <p className="text-gray-700">• Changed your mind about the purchase</p>
              <p className="text-gray-700">• Wanted to review the terms first</p>
              <p className="text-gray-700">• Technical issues during checkout</p>
              <p className="text-gray-700">• Payment method issues</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Try Again hidden while payments disabled */}
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>

          {/* Support */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              Having trouble with payments?
            </p>
            <p className="text-sm text-gray-500">
              Contact our support team at{' '}
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