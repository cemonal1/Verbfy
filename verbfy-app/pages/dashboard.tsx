import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../src/context/AuthContext';

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else {
        // Redirect to role-specific dashboard
        switch (user.role) {
          case 'student':
            router.replace('/student/dashboard');
            break;
          case 'teacher':
            router.replace('/teacher/dashboard');
            break;
          case 'admin':
            router.replace('/admin/dashboard');
            break;
          default:
            router.replace('/login');
        }
      }
    }
  }, [user, loading, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
} 