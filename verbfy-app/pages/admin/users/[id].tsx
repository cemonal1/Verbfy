import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRoleGuard } from '../../../src/hooks/useAuth';
import { useAdmin } from '../../../src/context/AdminContext';
import AdminSidebar from '../../../src/components/admin/AdminSidebar';
import { AdminUser } from '../../../src/types/admin';
import {
  ArrowLeftIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function AdminUserDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const { hasAccess, isLoading: authLoading } = useRoleGuard(['admin']);
  const { loadUserById, updateUserRole, updateUserStatus } = useAdmin();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [status, setStatus] = useState<'active' | 'inactive' | 'suspended'>('active');

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      if (!hasAccess || !id) return;
      setLoading(true);
      try {
        const data = await loadUserById(id);
        if (mounted) {
          setUser(data);
          if (data) {
            setRole((data.role as 'student' | 'teacher' | 'admin') || 'student');
            setStatus((data.status as 'active' | 'inactive' | 'suspended') || 'active');
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchUser();
    return () => { mounted = false; };
  }, [hasAccess, id, loadUserById]);

  const hasChanges = useMemo(() => {
    if (!user) return false;
    return user.role !== role || (user.status || 'active') !== status;
  }, [user, role, status]);

  const handleSave = async () => {
    if (!user || !id) return;
    setSaving(true);
    try {
      if (user.role !== role) {
        await updateUserRole(id, { role });
      }
      if ((user.status || 'active') !== status) {
        await updateUserStatus(id, { status });
      }
      const refreshed = await loadUserById(id);
      setUser(refreshed);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href="/admin/users" className="inline-flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Back to Users
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : !user ? (
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">User not found</h3>
                <p className="mt-1 text-sm text-gray-500">The requested user does not exist.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                    <p className="text-gray-600">{user.email}</p>
                    <p className="text-gray-500 text-sm mt-1">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'student' | 'teacher' | 'admin')}
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
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'active' | 'inactive' | 'suspended')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}