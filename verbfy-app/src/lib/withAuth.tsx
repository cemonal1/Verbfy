import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';

export function withAuthProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: string
) {
  const ComponentWithAuth = (props: P) => {
    const { user } = useAuthContext();
    const router = useRouter();

    useEffect(() => {
      if (!user) {
        router.replace('/login');
      } else if (requiredRole && user.role !== requiredRole) {
        router.replace('/unauthorized');
      }
    }, [user, requiredRole, router]);

    if (!user) return null;
    if (requiredRole && user.role !== requiredRole) return null;

    return <WrappedComponent {...props} />;
  };

  ComponentWithAuth.displayName = `withAuthProtection(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithAuth;
} 