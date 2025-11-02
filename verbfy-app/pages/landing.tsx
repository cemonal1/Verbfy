import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '@/context/AuthContext';
import HomeButton from '@/components/shared/HomeButton';
import BrandLogo from '@/components/shared/BrandLogo';
import { useI18n } from '@/lib/i18n';
type TeacherCard = {
  _id?: string;
  id?: string;
  slug?: string;
  name?: string;
  specialties?: string[];
  profileImage?: string;
  rating?: number;
  studentsCount?: number;
  experience?: string;
};

type MaterialCard = {
  _id?: string;
  id?: string;
  slug?: string;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  thumbnailUrl?: string;
};

export default function LandingPage() {
  const { user } = useAuthContext();
  const { t, locale } = useI18n();
  
  // State for data
  const [featuredTeachers, setFeaturedTeachers] = useState<TeacherCard[]>([]);
  const [featuredMaterials, setFeaturedMaterials] = useState<MaterialCard[]>([]);
  const [pricingPlans, setPricingPlans] = useState<Array<{ name: string; priceText: string; period?: string; features: string[]; popular?: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // List of GIFs to cycle through on click (place these files in /public)
  const gifSources = ['/logo.gif', '/logo-2.gif', '/logo-3.gif'];
  const [gifIndex, setGifIndex] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Load fallback data immediately for better UX
    const loadFallbackData = () => {
      const fallbackTeachers: TeacherCard[] = [
        {
          _id: '1',
          name: 'Sarah Johnson',
          specialties: ['Conversation', 'Business English'],
          profileImage: '/images/default-avatar.png',
          rating: 4.9,
          studentsCount: 150,
          experience: '5+ years'
        },
        {
          _id: '2', 
          name: 'Michael Chen',
          specialties: ['Grammar', 'IELTS Prep'],
          profileImage: '/images/default-avatar.png',
          rating: 4.8,
          studentsCount: 120,
          experience: '3+ years'
        },
        {
          _id: '3',
          name: 'Emma Wilson',
          specialties: ['Pronunciation', 'Kids English'],
          profileImage: '/images/default-avatar.png',
          rating: 4.9,
          studentsCount: 200,
          experience: '7+ years'
        }
      ];

      const fallbackMaterials: MaterialCard[] = [
        {
          _id: '1',
          title: 'Daily Conversation Starters',
          description: 'Essential phrases for everyday English conversations',
          category: 'Speaking',
          level: 'Beginner',
          thumbnailUrl: '/images/default-avatar.png'
        },
        {
          _id: '2',
          title: 'Business English Essentials', 
          description: 'Professional vocabulary and communication skills',
          category: 'Business',
          level: 'Intermediate',
          thumbnailUrl: '/images/default-avatar.png'
        },
        {
          _id: '3',
          title: 'Grammar Fundamentals',
          description: 'Master the basics of English grammar',
          category: 'Grammar',
          level: 'Beginner',
          thumbnailUrl: '/images/default-avatar.png'
        }
      ];

      const fallbackPricing = [
        { 
          name: 'Student Plan', 
          priceText: '$29', 
          period: '/month', 
          features: ['Unlimited lessons', 'AI feedback', 'Progress tracking'], 
          popular: false 
        },
        { 
          name: 'Premium Plan', 
          priceText: '$49', 
          period: '/month', 
          features: ['Everything in Student', 'Priority support', 'Group lessons'], 
          popular: true 
        },
        { 
          name: 'Enterprise', 
          priceText: '$99', 
          period: '/month', 
          features: ['Everything in Premium', 'Custom curriculum', 'Dedicated support'], 
          popular: false 
        }
      ];

      setFeaturedTeachers(fallbackTeachers);
      setFeaturedMaterials(fallbackMaterials);
      setPricingPlans(fallbackPricing);
      setIsLoading(false);
    };

    loadFallbackData();
  }, []);

  // Tailwind purges dynamic classes; map explicit gradient classes to ensure icons render
  const gradientByColor: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  const features = [
    {
      title: t('landing.feature.liveTalk.title','Live VerbfyTalk Rooms'),
      description: t('landing.feature.liveTalk.desc','Real-time conversation practice powered by LiveKit with low-latency audio/video.'),
      icon: 'fas fa-video',
      color: 'blue'
    },
    {
      title: t('landing.feature.aiLearning.title','AI Learning Assistant'),
      description: t('landing.feature.aiLearning.desc','Personalized recommendations, feedback and adaptive sessions.'),
      icon: 'fas fa-brain',
      color: 'green'
    },
    {
      title: t('landing.feature.lessons.title','Verbfy Lessons'),
      description: t('landing.feature.lessons.desc','Curated lesson flows aligned with CEFR and real-world scenarios.'),
      icon: 'fas fa-chalkboard-teacher',
      color: 'purple'
    },
    {
      title: t('landing.feature.freeMaterials.title','Free Materials'),
      description: t('landing.feature.freeMaterials.desc','Carefully designed materials, exercises and downloads.'),
      icon: 'fas fa-book-open',
      color: 'orange'
    },
    {
      title: t('landing.feature.cefr.title','CEFR Tests'),
      description: t('landing.feature.cefr.desc','Placement and practice tests to track your progress accurately.'),
      icon: 'fas fa-chart-line',
      color: 'pink'
    },
    {
      title: t('landing.feature.analytics.title','Progress Analytics'),
      description: t('landing.feature.analytics.desc','Track skills, streaks and achievements with clear dashboards.'),
      icon: 'fas fa-users',
      color: 'indigo'
    }
  ];

  const steps = [
    {
      number: '1',
      title: t('landing.how.step1.title','Sign Up'),
      description: t('landing.how.step1.desc','Create your free account and complete your learning profile in minutes.')
    },
    {
      number: '2',
      title: t('landing.how.step2.title','Choose Your Teacher'),
      description: t('landing.how.step2.desc','Browse our expert teachers and select the one that best fits your learning style.')
    },
    {
      number: '3',
      title: t('landing.how.step3.title','Book Your Lesson'),
      description: t('landing.how.step3.desc','Schedule your first lesson at a time that works for your busy schedule.')
    },
    {
      number: '4',
      title: t('landing.how.step4.title','Start Learning'),
      description: t('landing.how.step4.desc','Begin your English learning journey with personalized instruction and support.')
    }
  ];

  const teachers = featuredTeachers?.slice(0, 3) || [];

  const plans = pricingPlans && pricingPlans.length > 0 ? pricingPlans : [
    { name: 'Monthly Membership', priceText: '₺980', period: '/month', features: ['Unlimited platform access','All free materials','Community features','Includes 1 VerbfyToken (25 min 1:1 lesson)'] },
    { name: 'Yearly Membership', priceText: '₺9800', period: '/year', features: ['Everything in Monthly','Priority support','Includes 12 VerbfyTokens (12×25 min 1:1 lessons)'], popular: true },
    { name: 'VerbfyToken (Add-on)', priceText: '1 Token = 25 min 1:1', period: '', features: ['Spend 1 token per 25-minute 1:1 lesson','Token bundles available to active subscribers','Purchase after subscription'], popular: false },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Verbfy - Verbing Up Your Language Skills! | Learn English Online with Expert Teachers</title>
        <meta name="description" content="Verbing Up Your Language Skills! Master English with live video lessons, personalized learning, and expert teachers. Join thousands of learners worldwide." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Verbfy',
              slogan: 'Verbing Up Your Language Skills!'
            })
          }}
        />
      </Head>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <BrandLogo size={56} withTitle={false} />

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">{t('landing.nav.features','Features')}</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">{t('landing.nav.how','How it Works')}</a>
              <a href="#teachers" className="text-gray-600 hover:text-gray-900 transition-colors">{t('landing.nav.teachers','Teachers')}</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">{t('landing.nav.pricing','Pricing')}</a>
              <Link href="/level-test/free" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">{t('landing.nav.levelTest', locale==='tr'?'Seviyeni Ücretsiz Test Et':'Free Level Test')}</Link>
            </div>

            {/* Lang + Auth Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => (locale === 'en' ? (window.localStorage.setItem('locale','tr'), location.reload()) : (window.localStorage.setItem('locale','en'), location.reload()))}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                aria-label="Toggle language"
                title={locale === 'en' ? 'Türkçe' : 'English'}
              >
                {locale === 'en' ? 'TR' : 'EN'}
              </button>
              {user ? (
                <Link
                  href={user.role === 'student' ? '/student/dashboard' : '/teacher/dashboard'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('landing.nav.goDashboard','Go to Dashboard')}
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                    {t('landing.nav.signIn','Sign In')}
                  </Link>
                  <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    {t('landing.nav.getStarted','Get Started')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-white pt-10 sm:pt-12 lg:pt-16 pb-16 sm:pb-20 lg:pb-24 overflow-hidden">

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left: Headline */}
            <div className="text-center md:text-left order-2 md:order-1">
              <div className="inline-flex items-center px-3 py-1 mb-4 sm:mb-6 rounded-full bg-blue-100 text-blue-700 text-xs sm:text-sm font-semibold">Verbing Up Your Language Skills!</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8">
                {t('landing.hero.title1','Master English with')}{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('landing.hero.title2','Expert Teachers')}
              </span>
            </h1>
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-3xl md:max-w-none md:pr-6 leading-relaxed">{t('landing.hero.subtitle','Join thousands of learners worldwide and transform your English skills with live video lessons, personalized learning, and proven methodologies.')}</p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:justify-start justify-center">
              <Link 
                href="/register" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold text-lg sm:text-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                  {t('landing.hero.start','Start Learning Free')}
              </Link>
              <button className="border-2 border-gray-300 text-gray-700 px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold text-lg sm:text-xl hover:border-gray-400 hover:text-gray-900 transition-all duration-200">
                  {t('landing.hero.demo','Watch Demo')}
              </button>
              </div>
            </div>

            {/* Right: Only big logo display */}
            <div className="relative order-1 md:order-2">
              <div className="w-full flex flex-col items-center justify-center">
                <div
                  className="cursor-pointer"
                  style={{ width: 'clamp(220px, 30vw, 520px)' }}
                  onClick={() => setGifIndex((prev) => (prev === null ? 0 : (prev + 1) % gifSources.length))}
                  title="Play next animation"
                >
                  <Image
                    src={isClient && gifIndex !== null ? gifSources[gifIndex] : '/logo.png'}
                    alt="Verbfy logo"
                    width={1200}
                    height={1200}
                    className="w-full h-auto"
                    priority
                    sizes="(min-width:1024px) 30vw, (min-width:640px) 40vw, 60vw"
                    unoptimized={isClient && gifIndex !== null}
                  />
                </div>
                {/* Slogan intentionally removed per request */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verbfy Suite - placed right under hero */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{t('suite.title')}</h2>
            <p className="mt-3 text-gray-600">{t('suite.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* VerbfyTalk */}
            <details className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <summary className="list-none cursor-pointer">
              <div className="relative h-48 sm:h-56">
                <Image
                  src="/images/verbfy-talk.png"
                  alt="VerbfyTalk"
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-900">VerbfyTalk</h3>
                <p className="text-gray-600 mt-2">{t('suite.talk')}</p>
              </div>
              </summary>
            </details>

            {/* VerbfyListen */}
            <details className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <summary className="list-none cursor-pointer">
              <div className="relative h-48 sm:h-56">
                <Image
                  src="/images/verbfy-listen.png"
                  alt="VerbfyListen"
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-900">VerbfyListen</h3>
                <p className="text-gray-600 mt-2">{t('suite.listen')}</p>
              </div>
              </summary>
            </details>

            {/* VerbfyWrite */}
            <details className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <summary className="list-none cursor-pointer">
              <div className="relative h-48 sm:h-56">
                <Image
                  src="/images/verbfy-write.png"
                  alt="VerbfyWrite"
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-900">VerbfyWrite</h3>
                <p className="text-gray-600 mt-2">{t('suite.write')}</p>
              </div>
              </summary>
            </details>

            {/* VerbfyRead */}
            <details className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <summary className="list-none cursor-pointer">
              <div className="relative h-48 sm:h-56">
                <Image
                  src="/images/verbfy-read.png"
                  alt="VerbfyRead"
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-900">VerbfyRead</h3>
                <p className="text-gray-600 mt-2">{t('suite.read')}</p>
              </div>
              </summary>
            </details>

            {/* VerbfyGrammar */}
            <details className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <summary className="list-none cursor-pointer">
              <div className="relative h-48 sm:h-56">
                <Image
                  src="/images/verbfy-grammar.png"
                  alt="VerbfyGrammar"
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-900">VerbfyGrammar</h3>
                <p className="text-gray-600 mt-2">{t('suite.grammar')}</p>
              </div>
              </summary>
            </details>

            {/* VerbfyExam */}
            <details className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <summary className="list-none cursor-pointer">
              <div className="relative h-48 sm:h-56">
                <Image
                  src="/images/verbfy-exam.png"
                  alt="VerbfyExam"
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-900">VerbfyExam</h3>
                <p className="text-gray-600 mt-2">{t('suite.exam')}</p>
              </div>
              </summary>
            </details>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
              {t('landing.trust.title','Trusted by learners and teams worldwide')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 opacity-70">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs uppercase tracking-widest text-gray-500">LiveKit</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs uppercase tracking-widest text-gray-500">WebRTC</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs uppercase tracking-widest text-gray-500">AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                <span className="text-xs uppercase tracking-widest text-gray-500">CEFR</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free CEFR Level Test Promo (moved above Features heading to avoid splitting) */}
      <section className="py-10 sm:py-14 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{locale==='tr'?'Ücretsiz CEFR Seviye Testi':'Free CEFR Level Test'}</h3>
              <p className="text-gray-700 mb-4">
                {locale==='tr'
                  ? 'A1–C2 arası CEFR uyumlu yerleştirme testleriyle seviyeni dakikalar içinde öğren. Sonuç raporunda güçlü yönlerini ve geliştirme önerilerini gör.'
                  : 'Find your CEFR level (A1–C2) in minutes with our free placement tests. Get a detailed report with strengths and improvement tips.'}
              </p>
              <ul className="text-gray-700 text-sm space-y-1 mb-4 list-disc pl-5">
                <li>{locale==='tr'?'Ücretsiz, çevrimiçi ve hemen başla':'Free, online and start instantly'}</li>
                <li>{locale==='tr'?'CEFR/ALTE uyumlu değerlendirme':'CEFR/ALTE aligned assessment'}</li>
                <li>{locale==='tr'?'Sonuçta seviye ve önerilen modüller':'Level result and recommended modules'}</li>
              </ul>
                <Link href="/level-test/free" className="inline-flex items-center px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
                {locale==='tr'?'Seviyeni Ücretsiz Test Et':'Test Your Level Free'}
                <i className="fas fa-arrow-right ml-2"/>
              </Link>
            </div>
            <div className="w-full md:w-80">
              <Image src="/images/cefr-bands.png" alt="CEFR Levels" width={640} height={360} className="rounded-xl border border-blue-100 shadow-sm w-full h-auto object-contain"/>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">{t('landing.features.title','Why Choose Verbfy?')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('landing.features.subtitle','Our comprehensive platform combines cutting-edge technology with proven teaching methods to deliver exceptional results.')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className={`w-16 h-16 bg-gradient-to-r ${gradientByColor[feature.color] || 'from-blue-500 to-blue-600'} rounded-2xl flex items-center justify-center mb-6`}> 
                  <span className="relative inline-flex">
                    <span className="absolute inline-flex h-4 w-4 rounded-full opacity-75 bg-white/20 animate-ping" />
                    <i className={`${feature.icon} text-white text-2xl relative`}></i>
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Materials */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('landing.featuredMaterials.title','Featured Materials')}</h2>
              <p className="text-gray-600">{t('landing.featuredMaterials.subtitle','Hand-picked free resources to boost your skills')}</p>
            </div>
            <Link href="/free-materials" className="text-blue-600 hover:text-blue-700 font-semibold">
              {t('landing.featuredMaterials.viewAll','View all')}
            </Link>
          </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featuredMaterials || []).slice(0, 6).map((m, idx) => (
              <Link key={(m as any)._id || (m as any).id || idx} href={`/free-materials/${(m as any).slug || (m as any)._id || (m as any).id || ''}`} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="relative h-44">
                  <Image
                    src={(m as any).thumbnailUrl || 'https://images.unsplash.com/photo-1518081461904-9ac977c0f9a6?q=80&w=1080&auto=format&fit=crop'}
                    alt={(m as any).title || 'Material'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{(m as any).title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{(m as any).description}</p>
                  <div className="mt-3 flex items-center text-xs text-gray-500">
                    {(m as any).level && <span className="px-2 py-0.5 rounded-full bg-gray-100 mr-2">{(m as any).level}</span>}
                    {(m as any).category && <span className="px-2 py-0.5 rounded-full bg-gray-100">{(m as any).category}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">10k+</p>
              <p className="text-gray-600 text-sm mt-1">{t('landing.stats.learners','Active learners')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">5000+</p>
              <p className="text-gray-600 text-sm mt-1">{t('landing.stats.lessons','Live lessons delivered')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">150+</p>
              <p className="text-gray-600 text-sm mt-1">{t('landing.stats.teachers','Expert teachers')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">4.9/5</p>
              <p className="text-gray-600 text-sm mt-1">{t('landing.stats.rating','Average rating')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">{t('landing.how.title','How It Works')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('landing.how.subtitle','Get started with Verbfy in just four simple steps and begin your English learning journey today.')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teachers Section */}
      <section id="teachers" className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">{t('landing.teachers.title','Meet Our Expert Teachers')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('landing.teachers.subtitle','Learn from certified English teachers with years of experience and proven track records of student success.')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {teachers.map((teacher, index) => (
              <div key={(teacher._id || teacher.id || index) as any} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="text-center">
                  <Image 
                    src={teacher.profileImage || `https://i.pravatar.cc/256?u=${teacher._id || teacher.id || index}`}
                    alt={teacher.name || 'Teacher'}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full mx-auto mb-6 object-cover"
                  />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{teacher.name || 'Verbfy Teacher'}</h3>
                  <p className="text-blue-600 font-semibold mb-2">{(teacher as any).specialties?.[0] || 'English Teacher'}</p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 mb-4">
                    <span>{(teacher as any).experience || '5+ years'} experience</span>
                    <span>•</span>
                    <span>{((teacher as any).studentsCount || 100)} students</span>
                  </div>
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`fas fa-star ${i < Math.floor((teacher as any).rating || 5) ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">{(((teacher as any).rating || 4.9)).toFixed(1)}</span>
                  </div>
                  <Link href={`/student/reserve?teacherId=${encodeURIComponent((teacher as any).slug || teacher._id || teacher.id || '')}`} className="w-full inline-flex justify-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    {t('landing.teachers.book','Book Lesson')}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="mt-16 sm:mt-20">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">{t('landing.testimonials.title','What learners say')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  quote: 'Verbfy helped me gain confidence to speak at work meetings.',
                  author: 'Aylin, Product Manager'
                },
                {
                  quote: 'The AI recommendations kept me consistent and improving.',
                  author: 'Deniz, University Student'
                },
                {
                  quote: 'Live lessons were super engaging and practical.',
                  author: 'Emre, Software Engineer'
                }
              ].map((tItem, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <p className="text-gray-700 leading-relaxed">“{tItem.quote}”</p>
                  <p className="mt-4 text-sm text-gray-500">{tItem.author}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">{t('landing.pricing.title','Choose Your Plan')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('landing.pricing.subtitle','Flexible pricing plans designed to fit your learning goals and budget.')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {plans.map((plan, index) => {
              const planId = (plan as any).id || '';
              const nameLc = (plan.name || '').toLowerCase();
              const isTokenPlan = (typeof planId === 'string' && planId.toLowerCase().includes('verbfytoken')) || nameLc.includes('verbfytoken');
              const isMonthly = planId === 'membership-monthly' || nameLc.includes('monthly');
              const isYearly = planId === 'membership-yearly' || nameLc.includes('yearly');

              const displayName = isMonthly
                ? t('pricing.monthly.name', plan.name)
                : isYearly
                  ? t('pricing.yearly.name', plan.name)
                  : isTokenPlan
                    ? t('pricing.token.name', plan.name)
                    : plan.name;

              const displayBadge = (plan as any).badge
                ? (isMonthly
                    ? t('pricing.monthly.badge', (plan as any).badge)
                    : isYearly
                      ? t('pricing.yearly.badge', (plan as any).badge)
                      : (plan as any).badge)
                : undefined;

              const displayPriceText = isTokenPlan
                ? t('pricing.token.title', plan.priceText)
                : plan.priceText;
              const features = (() => {
                if (isMonthly) {
                  return [
                    t('pricing.monthly.f1','Unlimited platform access'),
                    t('pricing.monthly.f2','All free materials'),
                    t('pricing.monthly.f3','Community features'),
                    t('pricing.monthly.f4','Includes 1 VerbfyToken (25 min one-to-one lesson)'),
                  ];
                }
                if (isYearly) {
                  return [
                    t('pricing.yearly.f1','Everything in Monthly'),
                    t('pricing.yearly.f2','Priority support'),
                    t('pricing.yearly.f3','Includes 12 VerbfyTokens (12×25 min one-to-one lessons)'),
                  ];
                }
                if (isTokenPlan) {
                  return [
                    t('pricing.token.f1','Spend 1 token per 25-minute one-to-one lesson'),
                    t('pricing.token.f2','Token bundles available to active subscribers'),
                    t('pricing.token.f3','Purchase after subscription'),
                  ];
                }
                return plan.features;
              })();
              return (
              <div key={index} className={`bg-white p-8 rounded-2xl shadow-lg border-2 ${plan.popular ? 'border-blue-500 relative' : 'border-gray-100'} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">{t('landing.pricing.popular','Most Popular')}</span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h3>
                  {displayBadge && (
                    <p className="text-xs text-blue-600 font-semibold mb-3">{displayBadge}</p>
                  )}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{displayPriceText}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <i className="fas fa-check text-green-500 mr-3"></i>
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                    {t('landing.pricing.cta','Get Started')}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8">{t('landing.cta.title','Ready to Start Your English Journey?')}</h2>
          <p className="text-xl sm:text-2xl text-blue-100 mb-8 sm:mb-12 leading-relaxed">{t('landing.cta.subtitle','Join thousands of learners who have already transformed their English skills with Verbfy.')}</p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <Link href="/register" className="bg-white text-blue-600 px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold text-lg sm:text-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105">
              {t('landing.cta.start','Start Learning Free')}
            </Link>
            <button className="border-2 border-white text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold text-lg sm:text-xl hover:bg-white hover:text-blue-600 transition-all duration-200">
              {t('landing.cta.learnMore','Learn More')}
            </button>
          </div>
          {/* FAQ */}
          <div className="mt-12 text-left bg-white/10 rounded-xl p-4 sm:p-6">
            <h3 className="text-white text-xl font-semibold mb-4">{t('landing.faq.title','Frequently asked questions')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-blue-50">
              <div>
                <p className="font-semibold">{t('landing.faq.q1','How do live lessons work?')}</p>
                <p className="text-sm opacity-90">{t('landing.faq.a1','Join scheduled sessions with teachers via VerbfyTalk powered by LiveKit.')}</p>
              </div>
              <div>
                <p className="font-semibold">{t('landing.faq.q2','Can I learn for free?')}</p>
                <p className="text-sm opacity-90">{t('landing.faq.a2','Yes, explore hundreds of free materials and community sessions.')}</p>
              </div>
              <div>
                <p className="font-semibold">{t('landing.faq.q3','Is Verbfy for beginners?')}</p>
                <p className="text-sm opacity-90">{t('landing.faq.a3','Absolutely. Our CEFR-aligned modules cover A1 to C2.')}</p>
              </div>
              <div>
                <p className="font-semibold">{t('landing.faq.q4','Do you offer certificates?')}</p>
                <p className="text-sm opacity-90">{t('landing.faq.a4','Yes, complete paths award shareable certificates.')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            <div>
              <div className="flex items-center space-x-2 mb-6">
              <BrandLogo size={24} withTitle={false} />
              </div>
              <p className="text-gray-400 leading-relaxed">
                Empowering learners worldwide to master English through innovative technology and expert instruction.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Teachers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Materials</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Verbfy. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="fab fa-linkedin text-xl"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Home Button - Floating */}
      <HomeButton />
    </div>
  );
}