import React from 'react';
import DashboardLayout from '../src/layouts/DashboardLayout';
import { useAuthContext } from '../src/context/AuthContext';

function ProfilePage() {
  const { user } = useAuthContext();

  return (
    <DashboardLayout allowedRoles={['teacher', 'student']}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Profile</h1>
          <p className="text-xl text-gray-600 mb-6">Coming Soon - Manage your profile and settings</p>
          <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-user text-white text-2xl"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{user?.name || 'User'}</h2>
            <p className="text-gray-600 mb-2">{user?.email}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ProfilePage; 