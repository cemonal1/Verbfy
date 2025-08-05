import React from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TeacherCalendar from '@/components/teacher/TeacherCalendar';

const TeacherAvailabilityPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Manage Availability - Verbfy</title>
        <meta name="description" content="Manage your teaching availability and schedule" />
      </Head>
      
      <DashboardLayout allowedRoles={['teacher']}>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Availability</h1>
                <p className="text-gray-600 mt-2">
                  Set your weekly teaching schedule and let students know when you're available for lessons.
                </p>
              </div>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Available</span>
                <div className="w-3 h-3 bg-gray-200 rounded-full ml-4"></div>
                <span>Unavailable</span>
              </div>
            </div>
          </div>

          {/* Calendar Component */}
          <TeacherCalendar />

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Setting Your Schedule</h4>
                <ul className="space-y-1">
                  <li>• Click on time slots to mark them as available</li>
                  <li>• Each slot represents 30 minutes</li>
                  <li>• Use quick selection buttons for common patterns</li>
                  <li>• Your schedule repeats weekly</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Student Booking</h4>
                <ul className="space-y-1">
                  <li>• Students can only book during your available slots</li>
                  <li>• You'll receive notifications for new bookings</li>
                  <li>• You can modify your schedule anytime</li>
                  <li>• Changes apply to future weeks only</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default TeacherAvailabilityPage; 