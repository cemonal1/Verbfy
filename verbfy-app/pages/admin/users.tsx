import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRoleGuard } from '../../src/hooks/useAuth';
import { useAdmin } from '../../src/context/AdminContext';
import AdminSidebar from '../../src/components/admin/AdminSidebar';
import { AdminUser } from '../../src/types/admin';
import { 
  UserIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface EditUserModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: { name: string; email: string; role: string; status: string }) => void;
}

function EditUserModal({ user, isOpen, onClose, onSave }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    status: 'active'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'student',
        status: user.status || 'active'
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Edit User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard(['admin']);
  const { state, loadUsers, updateUser, updateUserRole, updateUserStatus, deleteUser, setUserFilters } = useAdmin();
  const { users, usersLoading, userFilters, usersPagination } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    if (hasAccess) {
      loadUsers(1, { 
        ...userFilters, 
        search: searchTerm, 
        role: roleFilter === 'all' ? undefined : roleFilter as 'student' | 'teacher' | 'admin',
        status: statusFilter === 'all' ? undefined : statusFilter as 'active' | 'inactive' | 'suspended'
      });
    }
  }, [hasAccess, loadUsers, searchTerm, roleFilter, statusFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setProcessingId(userId);
      await updateUserRole(userId, { role: newRole as 'student' | 'teacher' | 'admin' });
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      setProcessingId(userId);
      await updateUserStatus(userId, { status: newStatus as 'active' | 'inactive' | 'suspended' });
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        setProcessingId(userId);
        await deleteUser(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleViewUser = (user: AdminUser) => {
    setViewingUser(user);
    setIsViewModalOpen(true);
  };

  const handleSaveUser = async (userData: { name: string; email: string; role: string; status: string }) => {
    if (!editingUser) return;
    
    try {
      setProcessingId(editingUser._id);
      // Update name/email if changed
      const updates: { name?: string; email?: string } = {};
      if (userData.name !== (editingUser.name || '')) {
        updates.name = userData.name;
      }
      if (userData.email !== (editingUser.email || '')) {
        updates.email = userData.email;
      }
      if (updates.name || updates.email) {
        await updateUser(editingUser._id, updates);
      }
      // Update role if changed
      if (userData.role !== editingUser.role) {
        await updateUserRole(editingUser._id, { role: userData.role as 'student' | 'teacher' | 'admin' });
      }
      // Update status if changed
      if (userData.status !== editingUser.status) {
        await updateUserStatus(editingUser._id, { status: userData.status as 'active' | 'inactive' | 'suspended' });
      }
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFilters({ ...userFilters, search: searchTerm });
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Additional security check
  if (!hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar className="w-64" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage users, roles, and permissions</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </form>

              {/* Role Filter */}
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {usersLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">No users match your current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            disabled={processingId === user._id}
                            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                          >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.status || 'active'}
                            onChange={(e) => handleStatusChange(user._id, e.target.value)}
                            disabled={processingId === user._id}
                            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {/* View Button */}
                            <Link
                              href={`/admin/users/${user._id}`}
                              className="text-gray-600 hover:text-gray-900 p-1 rounded disabled:opacity-50"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditUser(user)}
                              disabled={processingId === user._id}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded disabled:opacity-50"
                              title="Edit User"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={processingId === user._id}
                              className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                              title="Delete User"
                            >
                              {processingId === user._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {usersPagination && usersPagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => loadUsers(usersPagination.page - 1, userFilters)}
                    disabled={usersPagination.page <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => loadUsers(usersPagination.page + 1, userFilters)}
                    disabled={usersPagination.page >= usersPagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(usersPagination.page - 1) * usersPagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(usersPagination.page * usersPagination.limit, usersPagination.total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{usersPagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => loadUsers(usersPagination.page - 1, userFilters)}
                        disabled={usersPagination.page <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => loadUsers(usersPagination.page + 1, userFilters)}
                        disabled={usersPagination.page >= usersPagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
      />

      {/* View User Modal */}
      {isViewModalOpen && viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">User Details</h2>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingUser(null);
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500">Name</span>
                <p className="text-sm font-medium text-gray-900">{viewingUser.name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Email</span>
                <p className="text-sm text-gray-900">{viewingUser.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500">Role</span>
                  <p className="text-sm text-gray-900 capitalize">{viewingUser.role}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Status</span>
                  <p className="text-sm text-gray-900 capitalize">{viewingUser.status || 'active'}</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Joined</span>
                <p className="text-sm text-gray-900">{new Date(viewingUser.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingUser(null);
                }}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


