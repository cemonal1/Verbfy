import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';
import api, { setApiAccessToken } from '@/lib/api';
import { toastError } from '@/lib/toast';
import { AuthUser } from '../model/AuthUser';

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function useLoginViewModel() {
  const { setUser, setAccessToken } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<LoginResponse>('/api/auth/login', { email, password });
      setApiAccessToken(res.data.accessToken);
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
      
      // Log for debugging
      console.log('Login successful:', res.data.user);
      console.log('User role:', res.data.user.role);
      
      // Redirect based on role
      if (res.data.user.role === 'student') {
        console.log('Redirecting to student dashboard');
        router.push('/student/dashboard');
      } else if (res.data.user.role === 'teacher') {
        console.log('Redirecting to teacher dashboard');
        router.push('/teacher/dashboard');
      } else {
        console.log('Redirecting to default dashboard');
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Login failed';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }, [setUser, setAccessToken, router]);

  return { login, loading, error };
} 