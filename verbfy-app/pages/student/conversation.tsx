import React from 'react';
import DashboardLayout from '../../src/layouts/DashboardLayout';
import Link from 'next/link';

function StudentConversationPage() {
  return (
    <DashboardLayout allowedRoles={['student']}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Conversation Rooms</h1>
          <p className="text-xl text-gray-600 mb-6">Coming Soon - Join conversation rooms to practice English</p>
          <Link 
            href="/rooms" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Browse Rooms
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentConversationPage; 