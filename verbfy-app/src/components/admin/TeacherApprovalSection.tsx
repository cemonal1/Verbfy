import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/common/Toast';
import api from '@/lib/api';

interface PendingTeacher {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  bio?: string;
  specialties?: string[];
  experience?: number;
  education?: string;
  certifications?: string[];
  cvUrl?: string;
  introVideoUrl?: string;
  hourlyRate?: number;
}

export default function TeacherApprovalSection() {
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    loadPendingTeachers();
  }, []);

  const loadPendingTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/teachers/pending');
      setPendingTeachers(response.data.data || []);
    } catch (error) {
      console.error('Error loading pending teachers:', error);
      toastError('Failed to load pending teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (teacherId: string) => {
    try {
      setApproving(teacherId);
      await api.patch(`/api/admin/teachers/${teacherId}/approve`);
      
      // Remove from pending list
      setPendingTeachers(prev => prev.filter(t => t._id !== teacherId));
      
      toastSuccess('Teacher approved successfully!');
    } catch (error) {
      console.error('Error approving teacher:', error);
      toastError('Failed to approve teacher');
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (teacherId: string, reason: string) => {
    try {
      setRejecting(teacherId);
      await api.patch(`/api/admin/teachers/${teacherId}/reject`, { reason });
      
      // Remove from pending list
      setPendingTeachers(prev => prev.filter(t => t._id !== teacherId));
      
      toastSuccess('Teacher rejected successfully!');
      setShowRejectModal(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting teacher:', error);
      toastError('Failed to reject teacher');
    } finally {
      setRejecting(null);
    }
  };

  const openRejectModal = (teacherId: string) => {
    setShowRejectModal(teacherId);
    setRejectReason('');
  };

  const closeRejectModal = () => {
    setShowRejectModal(null);
    setRejectReason('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading pending teachers...</span>
      </div>
    );
  }

  if (pendingTeachers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-check text-2xl text-green-600 dark:text-green-400"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Pending Approvals</h3>
        <p className="text-gray-500 dark:text-gray-400">All teacher applications have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingTeachers.map((teacher) => (
        <div key={teacher._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Teacher Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-chalkboard-teacher text-blue-600 dark:text-blue-400"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {teacher.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">{teacher.email}</p>
                  
                  {/* Teacher Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {teacher.bio && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Bio:</span>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{teacher.bio}</p>
                      </div>
                    )}
                    
                    {teacher.specialties && teacher.specialties.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Specialties:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {teacher.specialties.map((specialty, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {teacher.experience && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Experience:</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">{teacher.experience} years</span>
                      </div>
                    )}
                    
                    {teacher.education && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Education:</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">{teacher.education}</span>
                      </div>
                    )}
                    
                    {teacher.hourlyRate && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Hourly Rate:</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">${teacher.hourlyRate}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Applied: {new Date(teacher.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
              <button
                onClick={() => handleApprove(teacher._id)}
                disabled={approving === teacher._id}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                {approving === teacher._id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Approve
                  </>
                )}
              </button>
              
              <button
                onClick={() => openRejectModal(teacher._id)}
                disabled={rejecting === teacher._id}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                <i className="fas fa-times mr-2"></i>
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Reject Teacher Application
            </h3>
            
            <div className="mb-4">
              <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for rejection (optional)
              </label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="Provide a reason for rejection..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleReject(showRejectModal, rejectReason)}
                disabled={rejecting === showRejectModal}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors duration-200"
              >
                {rejecting === showRejectModal ? 'Rejecting...' : 'Reject'}
              </button>
              
              <button
                onClick={closeRejectModal}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
