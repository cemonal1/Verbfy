import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Verbfy</h2>
            <p className="text-gray-700 mb-6">
              By using Verbfy, you agree to these Terms of Service. Please read them carefully before using our platform.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Acceptance of Terms</h3>
            <p className="text-gray-700 mb-6">
              By accessing or using Verbfy, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">User Responsibilities</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Respect other users and teachers</li>
              <li>Use the platform for educational purposes only</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Teacher Responsibilities</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Provide quality educational content</li>
              <li>Maintain professional conduct</li>
              <li>Respect student privacy and confidentiality</li>
              <li>Follow platform guidelines and policies</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Payment and Refunds</h3>
            <p className="text-gray-700 mb-6">
              Payment terms and refund policies are outlined in our separate Payment Terms document. 
              All payments are processed securely through our payment partners.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Intellectual Property</h3>
            <p className="text-gray-700 mb-6">
              All content on Verbfy, including but not limited to text, graphics, logos, and software, 
              is the property of Verbfy or its licensors and is protected by copyright laws.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Contact Information</h3>
            <p className="text-gray-700 mb-6">
              For questions about these Terms of Service, please contact us at legal@verbfy.com
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