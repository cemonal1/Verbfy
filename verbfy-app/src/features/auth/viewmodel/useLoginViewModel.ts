import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext, User } from '@/context/AuthContext';
import api, { authAPI, setApiAccessToken } from '@/lib/api';
import { toastError } from '@/lib/toast';

interface LoginResponse {
  accessToken?: string;
  token?: string;
  user: User;
}

export function useLoginViewModel() {
  const { login: contextLogin, setUser, setAccessToken } = useAuthContext();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Automatically clear error when email or password changes to align with test expectations
  useEffect(() => {
    if (error) setError('');
  }, [email]);

  useEffect(() => {
    if (error) setError('');
  }, [password]);

  const isValidEmail = useCallback(() => {
    return /.+@.+\..+/.test(email);
  }, [email]);

  const isFormValid = useCallback(() => {
    return isValidEmail() && password.length > 0;
  }, [isValidEmail, password]);

  const handleLogin = useCallback(async () => {
    if (!isFormValid()) {
      setError('Invalid credentials');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.login({ email, password }) as unknown as { data: LoginResponse } | LoginResponse;
      const payload: LoginResponse = 'data' in (res as any) ? (res as any).data : (res as any);
      const access = payload.accessToken || payload.token;
      if (access) {
        setApiAccessToken(access);
        setAccessToken(access);
      }
      setUser(payload.user);
      // Let context login know as well (for backward compatibility in tests)
      await contextLogin(email, password);
      // Redirect based on role
      const role = payload.user.role;
      if (role === 'student') {
        router.push('/student/dashboard');
      } else if (role === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const msg = errorObj.response?.data?.message || 'Invalid credentials';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }, [email, password, isFormValid, contextLogin, setUser, setAccessToken, router]);

  return {
    email,
    password,
    loading,
    error,
    setEmail,
    setPassword,
    setError,
    handleLogin,
    isValidEmail,
    isFormValid,
  };
}