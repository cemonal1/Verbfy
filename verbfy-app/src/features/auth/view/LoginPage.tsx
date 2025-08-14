import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useLoginViewModel } from '../viewmodel/useLoginViewModel';
import HomeButton from '@/components/shared/HomeButton';
import BrandLogo from '@/components/shared/BrandLogo';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const { login, loading, error } = useLoginViewModel();
  const { t, locale, setLocale } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    await login(email, password);
  };

  const handleSocialLogin = (provider: 'google' | 'outlook' | 'apple') => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const w = 520, h = 600;
    const y = window.top?.outerHeight ? Math.max(0, (window.top!.outerHeight - h) / 2) : 100;
    const x = window.top?.outerWidth ? Math.max(0, (window.top!.outerWidth - w) / 2) : 100;
    window.open(`${base}/api/auth/oauth/${provider}`, 'oauthLogin', `width=${w},height=${h},left=${x},top=${y}`);
    const handler = (event: MessageEvent) => {
      const data: any = event.data || {};
      if (data?.type === 'oauth-success' && data?.token) {
        window.location.href = '/dashboard';
      }
    };
    window.addEventListener('message', handler, { once: true });
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
          <p className="text-gray-600 text-base sm:text-lg">{t('auth.login.welcome','Welcome back to your learning journey')}</p>
        </div>

        {/* Main Login Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 space-y-6">
            <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t('auth.login.title','Sign in to your account')}</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Continue your English learning adventure
            </p>
          </div>

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('auth.login.email','Email address')}</label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900 bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                  placeholder={t('auth.login.emailPlaceholder','Enter your email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <i className="fas fa-envelope text-gray-400"></i>
                </div>
              </div>
            </div>
            {/* If the user is a teacher awaiting approval, we could show a notice after login; handled post-auth */}

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('auth.login.password','Password')}</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900 bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                  placeholder={t('auth.login.passwordPlaceholder','Enter your password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-400 hover:text-gray-600 transition-colors`}></i>
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  {t('auth.login.remember','Remember me')}
                </label>
              </div>
              <Link 
                href="/forgot-password" 
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 hover:underline"
              >
                {t('auth.login.forgot','Forgot your password?')}
              </Link>
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

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('auth.login.signingin','Signing in...')}
                </div>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  {t('auth.login.submit','Sign in')}
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
              <span className="px-2 bg-white text-gray-500">{t('auth.login.or','Or continue with')}</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full inline-flex justify-center py-2.5 sm:py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <i className="fab fa-google text-red-500 mr-3"></i>
              {t('auth.login.google','Sign in with Google')}
            </button>
            
            <button
              onClick={() => handleSocialLogin('outlook')}
              className="w-full inline-flex justify-center py-2.5 sm:py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <i className="fas fa-envelope text-blue-500 mr-3"></i>
              {t('auth.login.outlook','Sign in with Outlook')}
            </button>
            
            <button
              onClick={() => handleSocialLogin('apple')}
              className="w-full inline-flex justify-center py-2.5 sm:py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <i className="fab fa-apple text-gray-900 mr-3"></i>
              {t('auth.login.apple','Sign in with Apple')}
            </button>
          </div>
        </div>

        {/* Sign Up CTA */}
        <div className="text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            {t('auth.login.new','New to Verbfy?')}{' '}
            <Link 
              href="/register" 
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200 hover:underline"
            >
              {t('auth.login.join','Join Now')}
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