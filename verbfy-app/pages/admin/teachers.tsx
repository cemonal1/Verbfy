import React, { useEffect, useState } from 'react';
import { useRoleGuard } from '../../src/hooks/useAuth';
import { useAdmin } from '../../src/context/AdminContext';
import AdminSidebar from '../../src/components/admin/AdminSidebar';
import { 
  CheckIcon, 
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function TeacherApproval() {
  const { hasAccess, isLoading: authLoading, user } = useRoleGuard(['admin']);
  const { state, loadPendingTeachers, approveTeacher, rejectTeacher } = useAdmin();
  const { pendingTeachers, teachersLoading } = state;
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Additional security check
  if (!hasAccess || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (hasAccess) {
      loadPendingTeachers();
    }
  }, [hasAccess, loadPendingTeachers]);



  const handleApprove = async (teacherId: string) => {
    setProcessingId(teacherId);
    await approveTeacher(teacherId);
    setProcessingId(null);
  };

  const handleReject = async (teacherId: string, reason?: string) => {
    setProcessingId(teacherId);
    await rejectTeacher(teacherId, reason);
    setProcessingId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar className="w-64" />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Teacher Approval</h1>
            <p className="text-gray-600 mt-2">Review and approve pending teacher applications</p>
          </div>

          {teachersLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : pendingTeachers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Applications</h3>
              <p className="text-gray-600">There are no teacher applications waiting for approval.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {pendingTeachers.map((teacher) => (
                <div key={teacher._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-100 rounded-full p-3 mr-4">
                          <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{teacher.name}</h3>
                          <div className="flex items-center text-gray-600 mt-1">
                            <EnvelopeIcon className="h-4 w-4 mr-1" />
                            <span className="text-sm">{teacher.email}</span>
                          </div>
                        </div>
                      </div>

                      {teacher.bio && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Bio</h4>
                          <p className="text-gray-600 text-sm">{teacher.bio}</p>
                        </div>
                      )}

                      {teacher.phone && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Phone</h4>
                          <p className="text-gray-600 text-sm">{teacher.phone}</p>
                        </div>
                      )}

                      <div className="flex items-center text-gray-500 text-sm">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>Applied on {formatDate(teacher.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex space-x-3 ml-6">
                      <button
                        onClick={() => handleApprove(teacher._id)}
                        disabled={processingId === teacher._id}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingId === teacher._id ? (
                          <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckIcon className="h-4 w-4 mr-2" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(teacher._id)}
                        disabled={processingId === teacher._id}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingId === teacher._id ? (
                          <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XMarkIcon className="h-4 w-4 mr-2" />
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}