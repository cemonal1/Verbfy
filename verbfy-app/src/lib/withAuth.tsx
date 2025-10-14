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
    const requiredRoleRef = React.useRef(requiredRole);

    useEffect(() => {
      const rr = requiredRoleRef.current;
      if (!user) {
        router.replace('/login');
      } else if (rr && user.role !== rr) {
        router.replace('/unauthorized');
      }
    }, [user, router]);

    if (!user) return null;
    if (requiredRoleRef.current && user.role !== requiredRoleRef.current) return null;

    return <WrappedComponent {...props} />;
  };

  ComponentWithAuth.displayName = `withAuthProtection(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithAuth;
}