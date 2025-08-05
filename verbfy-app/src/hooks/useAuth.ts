import { useAuth as useAuthContext, useRoleGuard as useRoleGuardFromContext } from '../context/AuthContext';

// Re-export the main auth hook
export { useAuthContext as useAuth };

// Role-based access hook
export function useRoleGuard(allowedRoles: ('student' | 'teacher' | 'admin')[]) {
  return useRoleGuardFromContext(allowedRoles);
}

// Hook to check if user has specific role
export function useHasRole(role: 'student' | 'teacher' | 'admin') {
  const { user } = useAuthContext();
  return user?.role === role;
}

// Hook to check if user has any of the specified roles
export function useHasAnyRole(roles: ('student' | 'teacher' | 'admin')[]) {
  const { user } = useAuthContext();
  return user ? roles.includes(user.role) : false;
}

// Hook to check if user is authenticated
export function useIsAuthenticated() {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated;
}

// Hook to get current user role
export function useUserRole() {
  const { user } = useAuthContext();
  return user?.role;
}

// Hook to check if user can access materials (upload)
export function useCanUploadMaterials() {
  const { user } = useAuthContext();
  return user?.role === 'teacher' || user?.role === 'admin';
}

// Hook to check if user can manage materials (delete)
export function useCanManageMaterials() {
  const { user } = useAuthContext();
  return user?.role === 'teacher' || user?.role === 'admin';
}

// Hook to check if user is admin
export function useIsAdmin() {
  const { user } = useAuthContext();
  return user?.role === 'admin';
}

// Hook to check if user is teacher
export function useIsTeacher() {
  const { user } = useAuthContext();
  return user?.role === 'teacher';
}

// Hook to check if user is student
export function useIsStudent() {
  const { user } = useAuthContext();
  return user?.role === 'student';
}

// Hook to get user permissions
export function useUserPermissions() {
  const { user } = useAuthContext();
  
  if (!user) return null;

  const permissions = {
    canUploadMaterials: user.role === 'teacher' || user.role === 'admin',
    canManageMaterials: user.role === 'teacher' || user.role === 'admin',
    canViewAnalytics: user.role === 'admin',
    canManageUsers: user.role === 'admin',
    canViewEarnings: user.role === 'teacher' || user.role === 'admin',
    canBookLessons: user.role === 'student',
    canTeachLessons: user.role === 'teacher',
    canAccessAdminPanel: user.role === 'admin',
  };

  return permissions;
}

// Hook to check if user can access a specific feature
export function useCanAccess(feature: string) {
  const permissions = useUserPermissions();
  
  if (!permissions) return false;

  const featurePermissions: Record<string, boolean> = {
    'materials.upload': permissions.canUploadMaterials,
    'materials.manage': permissions.canManageMaterials,
    'analytics.view': permissions.canViewAnalytics,
    'users.manage': permissions.canManageUsers,
    'earnings.view': permissions.canViewEarnings,
    'lessons.book': permissions.canBookLessons,
    'lessons.teach': permissions.canTeachLessons,
    'admin.panel': permissions.canAccessAdminPanel,
  };

  return featurePermissions[feature] || false;
}

// Hook to get user dashboard URL
export function useDashboardUrl() {
  const { user } = useAuthContext();
  
  if (!user) return '/login';
  
  switch (user.role) {
    case 'student':
      return '/dashboard/student';
    case 'teacher':
      return '/dashboard/teacher';
    case 'admin':
      return '/dashboard/admin';
    default:
      return '/login';
  }
}

// Hook to check if user should be redirected
export function useShouldRedirect() {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  
  if (isLoading) return { shouldRedirect: false, redirectTo: null };
  
  if (!isAuthenticated) {
    return { shouldRedirect: true, redirectTo: '/login' };
  }
  
  if (user) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    
    // Check if user is on the correct dashboard
    const expectedDashboard = `/dashboard/${user.role}`;
    if (currentPath.startsWith('/dashboard') && currentPath !== expectedDashboard) {
      return { shouldRedirect: true, redirectTo: expectedDashboard };
    }
  }
  
  return { shouldRedirect: false, redirectTo: null };
} 