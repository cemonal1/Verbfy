import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Locale = 'en' | 'tr';

type Messages = Record<string, string>;

interface I18nContextValue {
  locale: Locale;
  t: (key: string, fallback?: string) => string;
  setLocale: (loc: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const en: Messages = {
  'auth.login.title': 'Sign in',
  'auth.login.email': 'Email',
  'auth.login.password': 'Password',
  'auth.login.submit': 'Sign in',
  'auth.login.welcome': 'Welcome back to your learning journey',
  'auth.login.emailPlaceholder': 'Enter your email',
  'auth.login.passwordPlaceholder': 'Enter your password',
  'auth.login.remember': 'Remember me',
  'auth.login.forgot': 'Forgot your password?',
  'auth.login.signingin': 'Signing in...',
  'auth.login.or': 'Or continue with',
  'auth.login.google': 'Sign in with Google',
  'auth.login.outlook': 'Sign in with Outlook',
  'auth.login.apple': 'Sign in with Apple',
  'auth.login.new': 'New to Verbfy?',
  'auth.login.join': 'Join Now',

  'auth.register.title': 'Create account',
  'auth.register.tagline': 'Join the learning revolution',
  'auth.register.name': 'Full Name',
  'auth.register.namePlaceholder': 'Enter your full name',
  'auth.register.email': 'Email Address',
  'auth.register.emailPlaceholder': 'Enter your email',
  'auth.register.password': 'Password',
  'auth.register.passwordPlaceholder': 'Create a strong password',
  'auth.register.role': 'I want to join as',
  'auth.register.role.student': 'Student - Learn English',
  'auth.register.role.teacher': 'Teacher - Teach English (requires admin approval)',
  'auth.register.creating': 'Creating account...',
  'auth.register.submit': 'Create account',
  'auth.register.or': 'Or sign up with',
  'auth.register.google': 'Continue with Google',
  'auth.register.outlook': 'Continue with Outlook',
  'auth.register.apple': 'Continue with Apple',
  'auth.register.have': 'Already have an account?',
  'auth.register.signin': 'Sign in here',

  'nav.profile': 'Profile',
  'nav.dashboard': 'Dashboard',
  'nav.verbfytalk': 'VerbfyTalk',
  'nav.freeMaterials': 'Free Materials',
  'nav.verbfyLessons': 'Verbfy Lessons',
  'nav.cefrTests': 'CEFR Tests',
  'nav.curriculum': 'Personalized Curriculum',
  'nav.aiLearning': 'AI Learning Assistant',
  'nav.adaptive': 'Adaptive Learning',
  'nav.aiContent': 'AI Content Generation',
  'nav.chat': 'Chat',
  'nav.materials': 'Materials',
  'nav.payments': 'Payments',

  'profile.save': 'Save Changes',
  'profile.resendVerification': 'Resend verification',
  'profile.emailVerified': 'Your email is verified.',
  'profile.emailNotVerified': 'Your email is not verified.',
  'profile.name': 'Name',
  'profile.email': 'Email',
  'profile.bio': 'Bio',

  'forgot.title': 'Forgot Password',
  'forgot.email': 'Email',
  'forgot.submit': 'Send Reset Link',

  'reset.title': 'Reset Password',
  'reset.new': 'New Password (min 8 chars)',
  'reset.confirm': 'Confirm Password',
  'reset.submit': 'Reset Password',

  'verify.title': 'Verify Email',
  'verify.success': 'Email verified. You can close this page or go to dashboard.',
  'verify.goDashboard': 'Go to dashboard',

  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms of Service',
  'footer.help': 'Help Center',
  'footer.rights': 'All rights reserved.',

  // Landing
  'landing.nav.features': 'Features',
  'landing.nav.how': 'How it Works',
  'landing.nav.teachers': 'Teachers',
  'landing.nav.pricing': 'Pricing',
  'landing.nav.levelTest': 'Free Level Test',
  'landing.nav.signIn': 'Sign In',
  'landing.nav.getStarted': 'Get Started',
  'landing.nav.goDashboard': 'Go to Dashboard',

  'landing.hero.title1': 'Master English with',
  'landing.hero.title2': 'Expert Teachers',
  'landing.hero.subtitle': 'Join thousands of learners worldwide and transform your English skills with live video lessons, personalized learning, and proven methodologies.',
  'landing.hero.start': 'Start Learning Free',
  'landing.hero.demo': 'Watch Demo',

  'landing.features.title': 'Why Choose Verbfy?',
  'landing.features.subtitle': 'Our platform combines cutting-edge technology with proven teaching methods to deliver exceptional results.',
  'landing.feature.liveTalk.title': 'Live VerbfyTalk Rooms',
  'landing.feature.liveTalk.desc': 'Real-time conversation practice powered by LiveKit with low-latency audio/video.',
  'landing.feature.aiLearning.title': 'AI Learning Assistant',
  'landing.feature.aiLearning.desc': 'Personalized recommendations, feedback and adaptive sessions.',
  'landing.feature.lessons.title': 'Verbfy Lessons',
  'landing.feature.lessons.desc': 'Curated lesson flows aligned with CEFR and real-world scenarios.',
  'landing.feature.freeMaterials.title': 'Free Materials',
  'landing.feature.freeMaterials.desc': 'Carefully designed materials, exercises and downloads.',
  'landing.feature.cefr.title': 'CEFR Tests',
  'landing.feature.cefr.desc': 'Placement and practice tests to track your progress accurately.',
  'landing.feature.analytics.title': 'Progress Analytics',
  'landing.feature.analytics.desc': 'Track skills, streaks and achievements with clear dashboards.',

  // Featured materials
  'landing.featuredMaterials.title': 'Featured Materials',
  'landing.featuredMaterials.subtitle': 'Hand-picked free resources to boost your skills',
  'landing.featuredMaterials.viewAll': 'View all',

  'landing.how.title': 'How It Works',
  'landing.how.subtitle': 'Get started with Verbfy in just four simple steps.',
  'landing.how.step1.title': 'Sign Up',
  'landing.how.step1.desc': 'Create your free account and complete your profile.',
  'landing.how.step2.title': 'Choose Your Teacher',
  'landing.how.step2.desc': 'Find the right teacher for your goals and schedule.',
  'landing.how.step3.title': 'Book Your Lesson',
  'landing.how.step3.desc': 'Pick a time that works and reserve instantly.',
  'landing.how.step4.title': 'Start Learning',
  'landing.how.step4.desc': 'Join live sessions and follow your adaptive path.',

  'landing.teachers.title': 'Meet Our Expert Teachers',
  'landing.teachers.subtitle': 'Certified teachers with strong track records of student success.',
  'landing.teachers.book': 'Book Lesson',

  'landing.pricing.title': 'Choose Your Plan',
  'landing.pricing.subtitle': 'Flexible pricing designed to fit your goals and budget.',
  'landing.pricing.popular': 'Most Popular',
  'landing.pricing.cta': 'Get Started',

  // Pricing details
  'pricing.monthly.name': 'Monthly Membership',
  'pricing.monthly.badge': '1 Token Gift',
  'pricing.monthly.f1': 'Unlimited platform access',
  'pricing.monthly.f2': 'All free materials',
  'pricing.monthly.f3': 'Community features',
  'pricing.monthly.f4': 'Includes 1 VerbfyToken (25 min 1:1 lesson)',
  'pricing.yearly.name': 'Yearly Membership',
  'pricing.yearly.badge': 'Best Value • 12 Tokens Gift',
  'pricing.yearly.f1': 'Everything in Monthly',
  'pricing.yearly.f2': 'Priority support',
  'pricing.yearly.f3': 'Includes 12 VerbfyTokens (12×25 min 1:1 lessons)',
  'pricing.token.name': 'VerbfyToken (Add-on)',
  'pricing.token.title': '1 Token = 25 min One-to-one Private Lesson',
  'pricing.token.f1': 'Spend 1 token per 25-minute 1:1 lesson',
  'pricing.token.f2': 'Token bundles available to active subscribers',
  'pricing.token.f3': 'Purchase after subscription',

  'landing.cta.title': 'Ready to Start Your English Journey?',
  'landing.cta.subtitle': 'Join thousands of learners who already trust Verbfy.',
  'landing.cta.start': 'Start Learning Free',
  'landing.cta.learnMore': 'Learn More',

  // Testimonials & FAQ
  'landing.testimonials.title': 'What learners say',
  'landing.testimonials.q1': 'Verbfy helped me gain confidence to speak at work meetings.',
  'landing.testimonials.a1': 'Aylin, Product Manager',
  'landing.testimonials.q2': 'The AI recommendations kept me consistent and improving.',
  'landing.testimonials.a2': 'Deniz, University Student',
  'landing.testimonials.q3': 'Live lessons were super engaging and practical.',
  'landing.testimonials.a3': 'Emre, Software Engineer',
  'landing.faq.title': 'Frequently asked questions',
  'landing.faq.q1': 'How do live lessons work?',
  'landing.faq.a1': 'Join scheduled sessions with teachers via VerbfyTalk powered by LiveKit.',
  'landing.faq.q2': 'Can I learn for free?',
  'landing.faq.a2': 'Yes, explore hundreds of free materials and community sessions.',
  'landing.faq.q3': 'Is Verbfy for beginners?',
  'landing.faq.a3': 'Absolutely. Our CEFR-aligned modules cover A1 to C2.',
  'landing.faq.q4': 'Do you offer certificates?',
  'landing.faq.a4': 'Yes, complete paths award shareable certificates.',

  // Stats labels
  'landing.stats.learners': 'Active learners',
  'landing.stats.lessons': 'Live lessons delivered',
  'landing.stats.teachers': 'Expert teachers',
  'landing.stats.rating': 'Average rating',

  // Footer blocks
  'footer.blurb': 'Empowering learners worldwide to master English through innovative technology and expert instruction.',
  'footer.product': 'Product',
  'footer.company': 'Company',
  'footer.support': 'Support',
  'footer.links.features': 'Features',
  'footer.links.pricing': 'Pricing',
  'footer.links.teachers': 'Teachers',
  'footer.links.materials': 'Materials',
  'footer.links.about': 'About',
  'footer.links.careers': 'Careers',
  'footer.links.blog': 'Blog',
  'footer.links.contact': 'Contact',
  'footer.cookie': 'Cookie Policy',

  // Verbfy suite descriptions
  'suite.title': 'Learn the language in all dimensions.',
  'suite.subtitle': 'Modules specially designed for speaking, listening, writing, reading, grammar and exam preparation.',
  'suite.more': 'More',
  'suite.talk': 'Improve your fluency with live conversation rooms, natural dialogues and instant feedback.',
  'suite.listen': 'Practice real-life listening with podcasts, daily conversations and accent diversity.',
  'suite.write': 'Write more effectively with writing tasks, templates and AI-powered feedback.',
  'suite.read': 'Develop reading with level-appropriate texts, vocabulary work and comprehension questions.',
  'suite.grammar': 'Learn grammar systematically with topic explanations, interactive exercises and reinforcement tests.',
  'suite.exam': 'Prepare for your target score with CEFR-aligned mock exams, timed tests and detailed performance analysis.',

  // Common
  'common.loading': 'Loading...',
  'common.delete': 'Delete',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.preview': 'Preview',
  'common.submitting': 'Submitting...',

  // Home
  'home.title': 'Home',
  'home.stats.unread': 'Unread notifications',
  'home.stats.upcoming': 'Upcoming lessons',
  'home.stats.rooms': 'Open talk rooms',
  'home.stats.materials': 'Featured materials',
  'home.shortcut.teachers': 'Find Teachers',
  'home.shortcut.talk': 'Join VerbfyTalk',
  'home.shortcut.materials': 'Free Materials',
  'home.shortcut.cefr': 'CEFR Tests',
  'home.upcoming': 'Your upcoming lessons',
  'home.viewAll': 'View all',
  'home.upcomingEmpty': 'No upcoming lessons yet',
  'home.materialsEmpty': 'No featured materials yet',
  'home.rooms': 'Open VerbfyTalk rooms',
  'home.roomsEmpty': 'No rooms available right now',
  'home.lesson': 'Lesson',
  'home.manage': 'Manage',
  'home.room': 'Room',
  'home.private': 'Private',
  'home.public': 'Public',

  // Teachers
  'teachers.title': 'Find Teachers',
  'teachers.search': 'Search teachers',
  'teachers.empty': 'No teachers found',
  'teachers.detail': 'Teacher',
  'teachers.availability': 'Availability (next 7 days)',
  'teachers.noSlots': 'No slots',
  'teachers.selected': 'Selected',
  'teachers.book': 'Book Lesson',
  'teachers.booked': 'Reservation created',
  'teachers.bookError': 'Could not create reservation',

  // Teacher schedule
  'tschedule.title': 'My Schedule',
  'tschedule.add': 'Add available slot',
  'tschedule.date': 'Date',
  'tschedule.time': 'Time',
  'tschedule.duration': 'Duration (min)',
  'tschedule.addBtn': 'Add Slot',
  'tschedule.list': 'Upcoming availability',
  'tschedule.empty': 'No availability yet',

  // Teacher materials
  'tmaterials.title': 'My Materials',
  'tmaterials.upload': 'Upload new material',
  'tmaterials.titleLabel': 'Title',
  'tmaterials.level': 'Level',
  'tmaterials.category': 'Category',
  'tmaterials.description': 'Description',
  'tmaterials.file': 'File',
  'tmaterials.uploadBtn': 'Upload',
  'tmaterials.edit': 'Edit Material',

  // Teacher students
  'tstudents.title': 'My Students',
  'tstudents.empty': 'No students yet',

  // Teacher earnings
  'tearnings.title': 'Earnings',
  'tearnings.empty': 'No earnings yet',
  'tearnings.total': 'Total Earnings',
  'tearnings.month': 'This Month',
  'tearnings.sessions': 'Paid Sessions',

  // VerbfyTalk actions
  'talk.join': 'Join Room',
  'talk.joining': 'Joining...',

  // Admin common
  'admin.search': 'Search...',
  'admin.all': 'All',
  'admin.pending': 'Pending',
  'admin.approved': 'Approved',
  'admin.rejected': 'Rejected',
  'admin.actions': 'Actions',
  'admin.name': 'Name',
  'admin.email': 'Email',
  'admin.user': 'User',
  'admin.created': 'Created',
  'admin.delete': 'Delete',
  'admin.refund': 'Refund',
  'admin.prev': 'Prev',
  'admin.next': 'Next',
  'admin.page': 'Page',
  'admin.role': 'Role',
  'admin.status': 'Status',
  'admin.refresh': 'Refresh',
  'admin.student': 'Student',
  'admin.teacher': 'Teacher',
  'admin.admin': 'Admin',
  'admin.approve': 'Approve',
  'admin.reject': 'Reject',

  // Admin pages
  'admin.materials.title': 'Admin • Materials',
  'admin.materials.titleCol': 'Title',
  'admin.materials.level': 'Level',
  'admin.materials.category': 'Category',
  'admin.materials.uploader': 'Uploader',
  'admin.materials.status': 'Status',
  'admin.materials.approve': 'Approve',
  'admin.materials.reject': 'Unapprove',
  'admin.materials.empty': 'No materials',

  'admin.payments.title': 'Admin • Payments',
  'admin.payments.amount': 'Amount',
  'admin.succeeded': 'Succeeded',
  'admin.refunded': 'Refunded',
  'admin.failed': 'Failed',
  'admin.payments.empty': 'No payments',

  'admin.logs.title': 'Admin • Logs',
  'admin.logs.empty': 'No logs',

  'admin.users.title': 'User Management',
  'admin.users.pending': 'Pending Teacher Applications',
  'admin.users.noPending': 'No pending applications',
  'admin.users.all': 'All Users',
  'admin.users.empty': 'No users found',

  // Reservations
  'reservations.title': 'My Reservations',
  'reservations.empty': 'No reservations yet',

  // Materials
  'materials.title': 'Free Materials',
  'materials.search': 'Search materials',
  'materials.empty': 'No materials found',

  // VerbfyTalk
  'talk.title': 'VerbfyTalk Rooms',
  'talk.empty': 'No rooms available',
};

const tr: Messages = {
  'auth.login.title': 'Giriş yap',
  'auth.login.email': 'E-posta',
  'auth.login.password': 'Şifre',
  'auth.login.submit': 'Giriş yap',
  'auth.login.welcome': 'Öğrenme yolculuğunuza yeniden hoş geldiniz',
  'auth.login.emailPlaceholder': 'E-postanızı girin',
  'auth.login.passwordPlaceholder': 'Şifrenizi girin',
  'auth.login.remember': 'Beni hatırla',
  'auth.login.forgot': 'Şifrenizi mi unuttunuz?',
  'auth.login.signingin': 'Giriş yapılıyor...',
  'auth.login.or': 'Veya şununla devam edin',
  'auth.login.google': 'Google ile giriş yap',
  'auth.login.outlook': 'Outlook ile giriş yap',
  'auth.login.apple': 'Apple ile giriş yap',
  'auth.login.new': 'Verbfy’ye yeni misiniz?',
  'auth.login.join': 'Hemen Katıl',

  'auth.register.title': 'Hesap oluştur',
  'auth.register.tagline': 'Öğrenme devrimine katılın',
  'auth.register.name': 'Ad Soyad',
  'auth.register.namePlaceholder': 'Adınızı ve soyadınızı girin',
  'auth.register.email': 'E‑posta Adresi',
  'auth.register.emailPlaceholder': 'E‑postanızı girin',
  'auth.register.password': 'Şifre',
  'auth.register.passwordPlaceholder': 'Güçlü bir şifre oluşturun',
  'auth.register.role': 'Katılmak istediğim rol',
  'auth.register.role.student': 'Öğrenci – İngilizce öğren',
  'auth.register.role.teacher': 'Öğretmen – İngilizce öğret (admin onayı gerekir)',
  'auth.register.creating': 'Hesap oluşturuluyor...',
  'auth.register.submit': 'Hesap oluştur',
  'auth.register.or': 'Veya şu hesapla kaydol',
  'auth.register.google': 'Google ile devam et',
  'auth.register.outlook': 'Outlook ile devam et',
  'auth.register.apple': 'Apple ile devam et',
  'auth.register.have': 'Zaten hesabın var mı?',
  'auth.register.signin': 'Buradan giriş yap',

  'nav.profile': 'Profil',
  'nav.dashboard': 'Panel',
  'nav.verbfytalk': 'VerbfyTalk',
  'nav.freeMaterials': 'Ücretsiz Materyaller',
  'nav.verbfyLessons': 'Verbfy Dersleri',
  'nav.cefrTests': 'CEFR Testleri',
  'nav.curriculum': 'Kişiselleştirilmiş Müfredat',
  'nav.aiLearning': 'Yapay Zekâ Öğrenme Asistanı',
  'nav.adaptive': 'Uyarlanabilir Öğrenme',
  'nav.aiContent': 'YZ İçerik Üretimi',
  'nav.chat': 'Sohbet',
  'nav.materials': 'Materyaller',
  'nav.payments': 'Ödemeler',

  'profile.save': 'Değişiklikleri Kaydet',
  'profile.resendVerification': 'Doğrulama e-postasını tekrar gönder',
  'profile.emailVerified': 'E-postanız doğrulandı.',
  'profile.emailNotVerified': 'E-postanız doğrulanmadı.',
  'profile.name': 'Ad',
  'profile.email': 'E‑posta',
  'profile.bio': 'Biyografi',

  'forgot.title': 'Şifreyi Sıfırla',
  'forgot.email': 'E‑posta',
  'forgot.submit': 'Sıfırlama Bağlantısı Gönder',

  'reset.title': 'Şifreyi Sıfırla',
  'reset.new': 'Yeni Şifre (en az 8 karakter)',
  'reset.confirm': 'Şifreyi Doğrula',
  'reset.submit': 'Şifreyi Sıfırla',

  'verify.title': 'E‑postayı Doğrula',
  'verify.success': 'E‑posta doğrulandı. Bu sayfayı kapatabilir veya panele gidebilirsiniz.',
  'verify.goDashboard': 'Panele git',

  'footer.privacy': 'Gizlilik Politikası',
  'footer.terms': 'Kullanım Şartları',
  'footer.help': 'Yardım Merkezi',
  'footer.rights': 'Tüm hakları saklıdır.',

  // Landing
  'landing.nav.features': 'Özellikler',
  'landing.nav.how': 'Nasıl Çalışır',
  'landing.nav.teachers': 'Öğretmenler',
  'landing.nav.pricing': 'Fiyatlandırma',
  'landing.nav.levelTest': 'Seviyeni Ücretsiz Test Et',
  'landing.nav.signIn': 'Giriş Yap',
  'landing.nav.getStarted': 'Hemen Başla',
  'landing.nav.goDashboard': 'Panele Git',

  'landing.hero.title1': 'İngilizceyi',
  'landing.hero.title2': 'Uzman Öğretmenlerle Öğrenin',
  'landing.hero.subtitle': 'Canlı dersler, kişiselleştirilmiş öğrenme ve kanıtlanmış yöntemlerle binlerce öğrenci arasına katılın.',
  'landing.hero.start': 'Ücretsiz Başla',
  'landing.hero.demo': 'Demoyu İzle',

  'landing.features.title': 'Neden Verbfy?',
  'landing.features.subtitle': 'Platformumuz, ileri teknoloji ile kanıtlanmış öğretim yöntemlerini birleştirir.',
  'landing.feature.liveTalk.title': 'Canlı VerbfyTalk Odaları',
  'landing.feature.liveTalk.desc': 'LiveKit destekli düşük gecikmeli ses/görüntü ile gerçek zamanlı konuşma pratiği.',
  'landing.feature.aiLearning.title': 'YZ Öğrenme Asistanı',
  'landing.feature.aiLearning.desc': 'Kişiselleştirilmiş öneriler, geri bildirim ve uyarlanabilir oturumlar.',
  'landing.feature.lessons.title': 'Verbfy Dersleri',
  'landing.feature.lessons.desc': 'CEFR uyumlu, gerçek yaşam senaryolarıyla kurgulanmış ders akışları.',
  'landing.feature.freeMaterials.title': 'Ücretsiz Materyaller',
  'landing.feature.freeMaterials.desc': 'Özenle hazırlanmış materyaller, alıştırmalar ve indirmeler.',
  'landing.feature.cefr.title': 'CEFR Testleri',
  'landing.feature.cefr.desc': 'İlerlemenizi doğru izlemek için yerleştirme ve pratik testler.',
  'landing.feature.analytics.title': 'İlerleme Analitiği',
  'landing.feature.analytics.desc': 'Beceri, seri ve rozetlerinizi net panolarla takip edin.',

  // Featured materials
  'landing.featuredMaterials.title': 'Öne Çıkan Materyaller',
  'landing.featuredMaterials.subtitle': 'Becerilerinizi geliştirecek özenle seçilmiş ücretsiz kaynaklar',
  'landing.featuredMaterials.viewAll': 'Tümünü gör',

  'landing.how.title': 'Nasıl Çalışır',
  'landing.how.subtitle': 'Sadece dört adımda Verbfy ile başlayın.',
  'landing.how.step1.title': 'Kayıt Ol',
  'landing.how.step1.desc': 'Ücretsiz hesabınızı oluşturun ve profilinizi tamamlayın.',
  'landing.how.step2.title': 'Öğretmen Seç',
  'landing.how.step2.desc': 'Hedeflerinize ve programınıza uygun öğretmeni bulun.',
  'landing.how.step3.title': 'Ders Ayırt',
  'landing.how.step3.desc': 'Size uyan zamanı seçin ve anında ayırtın.',
  'landing.how.step4.title': 'Öğrenmeye Başla',
  'landing.how.step4.desc': 'Canlı oturumlara katılın ve uyarlanabilir yolunuzu izleyin.',

  'landing.teachers.title': 'Uzman Öğretmenlerimizle Tanışın',
  'landing.teachers.subtitle': 'Başarı kanıtlı, sertifikalı İngilizce öğretmenleri.',
  'landing.teachers.book': 'Ders Ayırt',

  'landing.pricing.title': 'Planını Seç',
  'landing.pricing.subtitle': 'Hedeflerinize ve bütçenize uygun esnek paketler.',
  'landing.pricing.popular': 'En Popüler',
  'landing.pricing.cta': 'Hemen Başla',

  // Pricing details (TR)
  'pricing.monthly.name': 'Aylık Üyelik',
  'pricing.monthly.badge': 'Hediye 1 Token',
  'pricing.monthly.f1': 'Sınırsız platform erişimi',
  'pricing.monthly.f2': 'Tüm ücretsiz materyaller',
  'pricing.monthly.f3': 'Topluluk özellikleri',
  'pricing.monthly.f4': '1 VerbfyToken hediyeli (25 dk 1:1 ders)',
  'pricing.yearly.name': 'Yıllık Üyelik',
  'pricing.yearly.badge': 'En İyi Seçim • 12 Token Hediye',
  'pricing.yearly.f1': 'Aylık paketteki her şey',
  'pricing.yearly.f2': 'Öncelikli destek',
  'pricing.yearly.f3': '12 VerbfyToken hediyeli (12×25 dk 1:1 ders)',
  'pricing.token.name': 'VerbfyToken (Eklenti)',
  'pricing.token.title': '1 Token = 25 dk Bire bir Özel Ders',
  'pricing.token.f1': 'Her 25 dakikalık Bire bir Özel Ders için 1 token harcanır',
  'pricing.token.f2': 'Token paketleri aktif abonelere sunulur',
  'pricing.token.f3': 'Satın alma abonelik sonrası yapılır',

  'landing.cta.title': 'İngilizce Yolculuğuna Hazır mısınız?',
  'landing.cta.subtitle': 'Verbfy’e güvenen binlerce öğrenciye katılın.',
  'landing.cta.start': 'Ücretsiz Başla',
  'landing.cta.learnMore': 'Daha Fazla Bilgi',

  // Testimonials & FAQ
  'landing.testimonials.title': 'Öğrenciler ne diyor',
  'landing.testimonials.q1': 'Verbfy iş toplantılarında konuşma özgüvenimi artırdı.',
  'landing.testimonials.a1': 'Aylin, Ürün Yöneticisi',
  'landing.testimonials.q2': 'YZ önerileri düzenli kalmama ve gelişmeme yardımcı oldu.',
  'landing.testimonials.a2': 'Deniz, Üniversite Öğrencisi',
  'landing.testimonials.q3': 'Canlı dersler çok etkileyici ve pratikti.',
  'landing.testimonials.a3': 'Emre, Yazılım Mühendisi',
  'landing.faq.title': 'Sık sorulan sorular',
  'landing.faq.q1': 'Canlı dersler nasıl çalışır?',
  'landing.faq.a1': 'LiveKit destekli VerbfyTalk üzerinden öğretmenlerle planlı oturumlara katılın.',
  'landing.faq.q2': 'Ücretsiz öğrenebilir miyim?',
  'landing.faq.a2': 'Evet, yüzlerce ücretsiz materyal ve topluluk oturumu keşfedebilirsiniz.',
  'landing.faq.q3': 'Verbfy yeni başlayanlar için uygun mu?',
  'landing.faq.a3': 'Kesinlikle. CEFR uyumlu modüllerimiz A1’den C2’ye kadar kapsar.',
  'landing.faq.q4': 'Sertifika veriyor musunuz?',
  'landing.faq.a4': 'Evet, yol haritalarını tamamladığınızda paylaşılabilir sertifikalar verilir.',

  // Stats labels
  'landing.stats.learners': 'Aktif öğrenci',
  'landing.stats.lessons': 'Gerçekleştirilen canlı ders',
  'landing.stats.teachers': 'Uzman öğretmen',
  'landing.stats.rating': 'Ortalama puan',

  // Footer blocks
  'footer.blurb': 'Yenilikçi teknoloji ve uzman öğretimle dünyanın dört bir yanında İngilizce öğrenmeyi güçlendiriyoruz.',
  'footer.product': 'Ürün',
  'footer.company': 'Şirket',
  'footer.support': 'Destek',
  'footer.links.features': 'Özellikler',
  'footer.links.pricing': 'Fiyatlandırma',
  'footer.links.teachers': 'Öğretmenler',
  'footer.links.materials': 'Materyaller',
  'footer.links.about': 'Hakkımızda',
  'footer.links.careers': 'Kariyer',
  'footer.links.blog': 'Blog',
  'footer.links.contact': 'İletişim',
  'footer.cookie': 'Çerez Politikası',

  // Verbfy suite descriptions
  'suite.title': 'Dili tüm boyutlarıyla öğrenin.',
  'suite.subtitle': 'Konuşma, dinleme, yazma, okuma, dil bilgisi ve sınav hazırlığı için özel olarak tasarlanmış modüller.',
  'suite.more': 'Detay',
  'suite.talk': 'Canlı konuşma odaları, doğal diyaloglar ve anlık geri bildirimle akıcılığınızı artırın.',
  'suite.listen': 'Podcast’ler, günlük diyaloglar ve aksan çeşitliliğiyle gerçek hayata yakın dinleme pratiği.',
  'suite.write': 'Yazma görevleri, şablonlar ve yapay zekâ destekli geri bildirimle daha etkili yazın.',
  'suite.read': 'Seviyeye uygun metinler, kelime çalışmaları ve anlama sorularıyla okuma becerinizi geliştirin.',
  'suite.grammar': 'Konu anlatımı, etkileşimli alıştırmalar ve pekiştirme testleriyle dil bilgisini sistemli öğrenin.',
  'suite.exam': 'CEFR uyumlu denemeler, zamanlı sınavlar ve ayrıntılı performans analiziyle hedef puanınıza hazırlanın.',

  // Common
  'common.loading': 'Yükleniyor...',
  'common.delete': 'Sil',
  'common.save': 'Kaydet',
  'common.cancel': 'İptal',
  'common.preview': 'Önizleme',
  'common.submitting': 'Gönderiliyor...',

  // Home
  'home.title': 'Ana Sayfa',
  'home.stats.unread': 'Okunmamış bildirim',
  'home.stats.upcoming': 'Yaklaşan dersler',
  'home.stats.rooms': 'Açık konuşma odaları',
  'home.stats.materials': 'Öne çıkan materyaller',
  'home.shortcut.teachers': 'Öğretmen Bul',
  'home.shortcut.talk': 'VerbfyTalk’a Katıl',
  'home.shortcut.materials': 'Ücretsiz Materyaller',
  'home.shortcut.cefr': 'CEFR Testleri',
  'home.upcoming': 'Yaklaşan derslerin',
  'home.viewAll': 'Tümünü gör',
  'home.upcomingEmpty': 'Yaklaşan ders yok',
  'home.materialsEmpty': 'Öne çıkan materyal yok',
  'home.rooms': 'Açık VerbfyTalk odaları',
  'home.roomsEmpty': 'Şu anda oda yok',
  'home.lesson': 'Ders',
  'home.manage': 'Yönet',
  'home.room': 'Oda',
  'home.private': 'Özel',
  'home.public': 'Genel',

  // Teachers
  'teachers.title': 'Öğretmen Bul',
  'teachers.search': 'Öğretmen ara',
  'teachers.empty': 'Öğretmen bulunamadı',
  'teachers.detail': 'Öğretmen',
  'teachers.availability': 'Müsaitlik (7 gün)',
  'teachers.noSlots': 'Uygun saat yok',
  'teachers.selected': 'Seçilen',
  'teachers.book': 'Ders Ayırt',
  'teachers.booked': 'Rezervasyon oluşturuldu',
  'teachers.bookError': 'Rezervasyon oluşturulamadı',

  // Teacher schedule
  'tschedule.title': 'Programım',
  'tschedule.add': 'Müsait saat ekle',
  'tschedule.date': 'Tarih',
  'tschedule.time': 'Saat',
  'tschedule.duration': 'Süre (dk)',
  'tschedule.addBtn': 'Slot Ekle',
  'tschedule.list': 'Yaklaşan müsaitlikler',
  'tschedule.empty': 'Henüz müsaitlik yok',

  // Teacher materials
  'tmaterials.title': 'Materyallerim',
  'tmaterials.upload': 'Yeni materyal yükle',
  'tmaterials.titleLabel': 'Başlık',
  'tmaterials.level': 'Seviye',
  'tmaterials.category': 'Kategori',
  'tmaterials.description': 'Açıklama',
  'tmaterials.file': 'Dosya',
  'tmaterials.uploadBtn': 'Yükle',
  'tmaterials.edit': 'Materyali Düzenle',

  // Teacher students
  'tstudents.title': 'Öğrencilerim',
  'tstudents.empty': 'Henüz öğrenci yok',

  // Teacher earnings
  'tearnings.title': 'Kazançlar',
  'tearnings.empty': 'Henüz kazanç yok',
  'tearnings.total': 'Toplam Kazanç',
  'tearnings.month': 'Bu Ay',
  'tearnings.sessions': 'Ücretli Oturum',

  // VerbfyTalk actions
  'talk.join': 'Odaya Katıl',
  'talk.joining': 'Katılıyor...',

  // Admin common
  'admin.search': 'Ara...',
  'admin.all': 'Tümü',
  'admin.pending': 'Beklemede',
  'admin.approved': 'Onaylı',
  'admin.rejected': 'Reddedildi',
  'admin.actions': 'Aksiyonlar',
  'admin.name': 'Ad',
  'admin.email': 'E‑posta',
  'admin.user': 'Kullanıcı',
  'admin.created': 'Oluşturulma',
  'admin.delete': 'Sil',
  'admin.refund': 'İade',
  'admin.prev': 'Önceki',
  'admin.next': 'Sonraki',
  'admin.page': 'Sayfa',
  'admin.role': 'Rol',
  'admin.status': 'Durum',
  'admin.refresh': 'Yenile',
  'admin.student': 'Öğrenci',
  'admin.teacher': 'Öğretmen',
  'admin.admin': 'Admin',
  'admin.approve': 'Onayla',
  'admin.reject': 'Reddet',

  // Admin pages
  'admin.materials.title': 'Admin • Materyaller',
  'admin.materials.titleCol': 'Başlık',
  'admin.materials.level': 'Seviye',
  'admin.materials.category': 'Kategori',
  'admin.materials.uploader': 'Yükleyen',
  'admin.materials.status': 'Durum',
  'admin.materials.approve': 'Onayla',
  'admin.materials.reject': 'Onayı Kaldır',
  'admin.materials.empty': 'Materyal yok',

  'admin.payments.title': 'Admin • Ödemeler',
  'admin.payments.amount': 'Tutar',
  'admin.succeeded': 'Başarılı',
  'admin.refunded': 'İade Edildi',
  'admin.failed': 'Başarısız',
  'admin.payments.empty': 'Ödeme yok',

  'admin.logs.title': 'Admin • Loglar',
  'admin.logs.empty': 'Log yok',

  'admin.users.title': 'Kullanıcı Yönetimi',
  'admin.users.pending': 'Bekleyen Öğretmen Başvuruları',
  'admin.users.noPending': 'Bekleyen başvuru yok',
  'admin.users.all': 'Tüm Kullanıcılar',
  'admin.users.empty': 'Kullanıcı bulunamadı',

  // Reservations
  'reservations.title': 'Rezervasyonlarım',
  'reservations.empty': 'Rezervasyon yok',

  // Materials
  'materials.title': 'Ücretsiz Materyaller',
  'materials.search': 'Materyal ara',
  'materials.empty': 'Materyal bulunamadı',

  // VerbfyTalk
  'talk.title': 'VerbfyTalk Odaları',
  'talk.empty': 'Uygun oda yok',
};

const messagesByLocale: Record<Locale, Messages> = { en, tr };

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('locale') as Locale | null) : null;
    if (saved && (saved === 'en' || saved === 'tr')) {
      setLocale(saved);
    } else if (typeof navigator !== 'undefined') {
      const lang = navigator.language?.toLowerCase() || '';
      if (lang.startsWith('tr')) setLocale('tr');
    }
  }, []);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale: (loc: Locale) => {
      setLocale(loc);
      if (typeof window !== 'undefined') localStorage.setItem('locale', loc);
    },
    t: (key: string, fallback?: string) => messagesByLocale[locale][key] ?? fallback ?? key,
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}


