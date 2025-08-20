import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import api, { setApiAccessToken } from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import HomeButton from '@/components/shared/HomeButton';
import BrandLogo from '@/components/shared/BrandLogo';
import { useI18n } from '@/lib/i18n';

interface RegisterResponse {
  accessToken: string;
  user: {
    _id: string;
    id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher';
    createdAt: string;
    updatedAt: string;
  };
}

export default function RegisterPage() {
  const { setUser, setAccessToken } = useAuthContext();
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      
      // Set the access token and user data
      setApiAccessToken(res.data.accessToken);
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
      
      // Log for debugging
      console.log('Registration successful:', res.data.user);
      
      // Redirect based on role
      if (res.data.user.role === 'student') {
        router.push('/student/dashboard');
      } else if (res.data.user.role === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/dashboard');
      }
      
      toastSuccess('Account created successfully!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Registration failed';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'outlook' | 'apple') => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.verbfy.com';
    const w = 520, h = 600;
    const y = window.top?.outerHeight ? Math.max(0, (window.top!.outerHeight - h) / 2) : 100;
    const x = window.top?.outerWidth ? Math.max(0, (window.top!.outerWidth - w) / 2) : 100;
    
    const popup = window.open(
      `${base}/api/auth/oauth/${provider}`, 
      'oauthLogin', 
      `width=${w},height=${h},left=${x},top=${y},scrollbars=yes,resizable=yes`
    );
    
    const handler = (event: MessageEvent) => {
      // Verify origin for security
      const expectedOrigin = new URL(base).origin;
      if (event.origin !== expectedOrigin) {
        console.warn('OAuth message from unexpected origin:', event.origin);
        return;
      }
      
      const data: any = event.data || {};
      console.log('OAuth message received:', data);
      
      if (data?.type === 'oauth-success' && data?.token && data?.user) {
        try {
          // Persist token for Socket.IO auth
          const { tokenStorage } = require('@/utils/secureStorage');
          tokenStorage.setToken(data.token);
          tokenStorage.setUser(data.user);
        } catch (_) {}
        
        // Close popup and redirect
        if (popup) popup.close();
        window.location.href = '/dashboard';
      } else if (data?.type === 'oauth-error') {
        console.error('OAuth error:', data.message);
        if (popup) popup.close();
        alert('OAuth authentication failed. Please try again.');
      }
    };
    
    window.addEventListener('message', handler, { once: false });
    
    // Cleanup handler if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handler);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setLocale(locale === 'en' ? 'tr' : 'en')}
          className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          aria-label="Toggle language"
          title={locale === 'en' ? 'Türkçe' : 'English'}
        >
          {locale === 'en' ? 'TR' : 'EN'}
        </button>
      </div>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
        {/* Logo and Brand */}
        <div className="text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <BrandLogo size={88} />
          </div>
          <p className="text-xs text-blue-600 font-semibold mb-1">Verbing Up Your Language Skills!</p>
          <p className="text-gray-600 text-base sm:text-lg">{t('auth.register.tagline','Join the learning revolution')}</p>
        </div>

        {/* Main Registration Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t('auth.register.title','Create your account')}</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Start your English learning journey today
            </p>
          </div>

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('auth.register.name','Full Name')}</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900 bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                placeholder={t('auth.register.namePlaceholder','Enter your full name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('auth.register.email','Email Address')}</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900 bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                placeholder={t('auth.register.emailPlaceholder','Enter your email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('auth.register.password','Password')}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900 bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                placeholder={t('auth.register.passwordPlaceholder','Create a strong password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">{t('auth.register.role','I want to join as')}</label>
              <select
                id="role"
                name="role"
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}
              >
                <option value="student">{t('auth.register.role.student','Student - Learn English')}</option>
                <option value="teacher">{t('auth.register.role.teacher','Teacher - Teach English (requires admin approval)')}</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                <div className="flex">
                  <i className="fas fa-exclamation-circle text-red-400 mt-0.5 mr-3"></i>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('auth.register.creating','Creating account...')}
                </div>
              ) : (
                <>
                  <i className="fas fa-user-plus mr-2"></i>
                  {t('auth.register.submit','Create account')}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t('auth.register.or','Or sign up with')}</span>
            </div>
          </div>

          {/* Social Registration Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full inline-flex justify-center py-2.5 sm:py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <i className="fab fa-google text-red-500 mr-3"></i>
              {t('auth.register.google','Continue with Google')}
            </button>
            
            <button
              onClick={() => handleSocialLogin('outlook')}
              className="w-full inline-flex justify-center py-2.5 sm:py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <i className="fas fa-envelope text-blue-500 mr-3"></i>
              {t('auth.register.outlook','Continue with Outlook')}
            </button>
            
            <button
              onClick={() => handleSocialLogin('apple')}
              className="w-full inline-flex justify-center py-2.5 sm:py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <i className="fab fa-apple text-gray-900 mr-3"></i>
              {t('auth.register.apple','Continue with Apple')}
            </button>
          </div>
        </div>

        {/* Sign In CTA */}
        <div className="text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            {t('auth.register.have','Already have an account?')}{' '}
            <Link 
              href="/login" 
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200 hover:underline"
            >
              {t('auth.register.signin','Sign in here')}
            </Link>
          </p>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">
              {t('footer.privacy','Privacy Policy')}
            </Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">
              {t('footer.terms','Terms of Service')}
            </Link>
            <Link href="/help" className="hover:text-gray-700 transition-colors">
              {t('footer.help','Help Center')}
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            © 2024 Verbfy. {t('footer.rights','All rights reserved.')}
          </p>
        </div>
      </div>

      {/* Home Button - Floating */}
      <HomeButton />
    </div>
  );
} 