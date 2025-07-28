import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Privacy Matters</h2>
            <p className="text-gray-700 mb-6">
              At Verbfy, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Account information (name, email, role)</li>
              <li>Learning progress and preferences</li>
              <li>Communication data during lessons</li>
              <li>Technical information for platform optimization</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">How We Use Your Information</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Provide personalized learning experiences</li>
              <li>Connect students with teachers</li>
              <li>Improve our platform and services</li>
              <li>Send important updates and notifications</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Security</h3>
            <p className="text-gray-700 mb-6">
              We implement industry-standard security measures to protect your personal information 
              from unauthorized access, alteration, disclosure, or destruction.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h3>
            <p className="text-gray-700 mb-6">
              If you have any questions about this Privacy Policy, please contact us at privacy@verbfy.com
            </p>
          </div>
          
          <div className="text-center mt-8">
            <Link 
              href="/login" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 