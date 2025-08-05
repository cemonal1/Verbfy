import React, { useState, useEffect } from 'react';
import { Role } from '@/types/roles';
import api from '@/lib/api';

interface RoleListProps {
  organizationId: string;
  onSelectRole: (role: Role) => void;
  onCreateNew: () => void;
}

export default function RoleList({ organizationId, onSelectRole, onCreateNew }: RoleListProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  useEffect(() => {
    fetchRoles();
  }, [organizationId]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/roles/${organizationId}`);
      setRoles(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles
    .filter(role => {
      const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || role.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'priority':
          return b.priority - a.priority;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system':
        return 'bg-purple-100 text-purple-800';
      case 'custom':
        return 'bg-blue-100 text-blue-800';
      case 'inherited':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionCount = (role: Role) => {
    let count = 0;
    Object.values(role.permissions).forEach(category => {
      Object.values(category).forEach(permission => {
        if (permission) count++;
      });
    });
    return count;
  };

  const getTotalPermissions = (role: Role) => {
    let total = 0;
    Object.values(role.permissions).forEach(category => {
      total += Object.keys(category).length;
    });
    return total;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Roles</h2>
          <p className="text-gray-600">Manage roles and their permissions</p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Role
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="system">System</option>
              <option value="custom">Custom</option>
              <option value="inherited">Inherited</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="type">Type</option>
              <option value="priority">Priority</option>
              <option value="created">Date Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      {filteredRoles.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating a new role.'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <div className="mt-6">
              <button
                onClick={onCreateNew}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Role
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => (
            <div
              key={role._id}
              onClick={() => onSelectRole(role)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="p-6">
                {/* Role Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {role.name}
                    </h3>
                    {role.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{role.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(role.type)}`}>
                      {role.type}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Priority: {role.priority}
                    </span>
                  </div>
                </div>

                {/* Role Details */}
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    {getPermissionCount(role)} of {getTotalPermissions(role)} permissions
                  </div>

                  {role.parentRoleId && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      Inherits from parent role
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    Role created {new Date(role.createdAt).toLocaleDateString()}
                  </div>

                  {/* Permission Summary */}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Key Permissions:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(role.permissions).slice(0, 3).map(([category, permissions]) => {
                        const hasPermissions = Object.values(permissions).some(p => p);
                        if (hasPermissions) {
                          return (
                            <span key={category} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {category}
                            </span>
                          );
                        }
                        return null;
                      })}
                      {Object.entries(role.permissions).filter(([_, permissions]) => 
                        Object.values(permissions).some(p => p)
                      ).length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          +{Object.entries(role.permissions).filter(([_, permissions]) => 
                            Object.values(permissions).some(p => p)
                          ).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Created Date */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created {new Date(role.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {filteredRoles.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">
            Showing {filteredRoles.length} of {roles.length} roles
          </p>
        </div>
      )}
    </div>
  );
} 