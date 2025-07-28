import React, { useState } from 'react';
import Link from 'next/link';

const faqs = [
  {
    question: "How do I get started with Verbfy?",
    answer: "Sign up for an account, choose your role (student or teacher), and start exploring our platform. Students can browse teachers and book lessons, while teachers can set their availability and create learning materials."
  },
  {
    question: "How do I book a lesson with a teacher?",
    answer: "Browse available teachers, check their schedules, and select a time slot that works for you. You can book lessons up to 24 hours in advance."
  },
  {
    question: "What happens if I need to cancel a lesson?",
    answer: "You can cancel lessons up to 2 hours before the scheduled time. Cancellations made within 2 hours may be subject to our cancellation policy."
  },
  {
    question: "How do I become a teacher on Verbfy?",
    answer: "Sign up as a teacher, complete your profile, and submit your qualifications. Our team will review your application and get back to you within 48 hours."
  },
  {
    question: "Is my personal information secure?",
    answer: "Yes, we take data security seriously. All personal information is encrypted and stored securely. We never share your data with third parties without your consent."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and other secure payment methods. All payments are processed securely through our trusted payment partners."
  }
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Help Center
            </h1>
            <p className="text-gray-600">Find answers to common questions and get support</p>
          </div>
          
          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
              <i className="fas fa-book text-3xl text-blue-600 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
              <p className="text-gray-600 text-sm">Learn how to use Verbfy effectively</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
              <i className="fas fa-question-circle text-3xl text-purple-600 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">FAQ</h3>
              <p className="text-gray-600 text-sm">Common questions and answers</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
              <i className="fas fa-headset text-3xl text-green-600 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Support</h3>
              <p className="text-gray-600 text-sm">Get help from our support team</p>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  onClick={() => toggleFaq(index)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                    <i className={`fas fa-chevron-${openFaq === index ? 'up' : 'down'} text-gray-400 transition-transform duration-200`}></i>
                  </div>
                </button>
                
                {openFaq === index && (
                  <div className="px-6 pb-4 bg-gray-50">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Contact Section */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Still Need Help?</h3>
            <p className="text-gray-700 mb-4">
              Our support team is here to help you. Contact us through any of these channels:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <i className="fas fa-envelope text-blue-600"></i>
                <span className="text-gray-700">support@verbfy.com</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <i className="fas fa-phone text-blue-600"></i>
                <span className="text-gray-700">+1 (555) 123-4567</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <i className="fas fa-comments text-blue-600"></i>
                <span className="text-gray-700">Live Chat (24/7)</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <i className="fas fa-clock text-blue-600"></i>
                <span className="text-gray-700">Response within 2 hours</span>
              </div>
            </div>
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