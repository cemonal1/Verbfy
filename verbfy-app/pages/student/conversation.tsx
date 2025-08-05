import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';

function StudentConversationPage() {
  return (
    <DashboardLayout allowedRoles={['student']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Conversation Rooms</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/rooms" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Join Room</h3>
            <p className="text-gray-600">Enter a conversation room to practice English.</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentConversationPage; 