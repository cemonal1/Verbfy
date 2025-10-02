import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { userAPI } from '@/lib/api';
import Image from 'next/image';
import api from '@/lib/api';

function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    bio: '', 
    phone: '', 
    specialties: '' as any, 
    experience: '' as any, 
    education: '', 
    certifications: '' as any, 
    cvUrl: '', 
    introVideoUrl: '',
    // New teacher customization fields
    hourlyRate: '' as any,
    teachingStyle: '',
    availability: '',
    languages: '' as any,
    timezone: '',
    // New student customization fields
    englishLevel: '',
    cefrLevel: '',
    learningGoals: '' as any,
    preferredLessonTypes: '' as any,
    nativeLanguage: '',
    dateOfBirth: '',
    nationality: '',
    // Additional student preferences
    studySchedule: '',
    preferredTeacherGender: '',
    communicationStyle: '',
    motivationLevel: '',
    studyGoals: '' as any,
    // Profile customization
    profileTheme: 'default',
    profileVisibility: 'public'
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        bio: (user as any).bio || '',
        phone: (user as any).phone || '',
        specialties: Array.isArray((user as any).specialties) ? (user as any).specialties.join(', ') : '',
        experience: (user as any).experience ?? '',
        education: (user as any).education || '',
        certifications: Array.isArray((user as any).certifications) ? (user as any).certifications.join(', ') : '',
        cvUrl: (user as any).cvUrl || '',
        introVideoUrl: (user as any).introVideoUrl || '',
        // Teacher fields
        hourlyRate: (user as any).hourlyRate ?? '',
        teachingStyle: (user as any).teachingStyle || '',
        availability: (user as any).availability || '',
        languages: Array.isArray((user as any).languages) ? (user as any).languages.join(', ') : '',
        timezone: (user as any).timezone || '',
        // Student fields
        englishLevel: (user as any).englishLevel || '',
        cefrLevel: (user as any).cefrLevel || '',
        learningGoals: Array.isArray((user as any).learningGoals) ? (user as any).learningGoals.join(', ') : '',
        preferredLessonTypes: Array.isArray((user as any).preferredLessonTypes) ? (user as any).preferredLessonTypes.join(', ') : '',
        nativeLanguage: (user as any).nativeLanguage || '',
        dateOfBirth: (user as any).dateOfBirth ? new Date((user as any).dateOfBirth).toISOString().split('T')[0] : '',
        nationality: (user as any).nationality || '',
        // Additional student preferences
        studySchedule: (user as any).studySchedule || '',
        preferredTeacherGender: (user as any).preferredTeacherGender || '',
        communicationStyle: (user as any).communicationStyle || '',
        motivationLevel: (user as any).motivationLevel || '',
        studyGoals: Array.isArray((user as any).studyGoals) ? (user as any).studyGoals.join(', ') : (user as any).studyGoals || '',
        // Profile customization
        profileTheme: (user as any).profileTheme || 'default',
        profileVisibility: (user as any).profileVisibility || 'public'
      });
    }
  }, [user]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await userAPI.updateProfile({
        ...form,
        specialties: typeof form.specialties === 'string' ? form.specialties.split(',').map(s => s.trim()).filter(Boolean) : form.specialties,
        certifications: typeof form.certifications === 'string' ? form.certifications.split(',').map(s => s.trim()).filter(Boolean) : form.certifications,
        languages: typeof form.languages === 'string' ? form.languages.split(',').map(s => s.trim()).filter(Boolean) : form.languages,
        learningGoals: typeof form.learningGoals === 'string' ? form.learningGoals.split(',').map(s => s.trim()).filter(Boolean) : form.learningGoals,
        preferredLessonTypes: typeof form.preferredLessonTypes === 'string' ? form.preferredLessonTypes.split(',').map(s => s.trim()).filter(Boolean) : form.preferredLessonTypes,
        experience: form.experience ? Number(form.experience) : undefined,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : undefined,
        // Additional student preferences
        studySchedule: form.studySchedule,
        preferredTeacherGender: form.preferredTeacherGender,
        communicationStyle: form.communicationStyle,
        motivationLevel: form.motivationLevel,
        studyGoals: typeof form.studyGoals === 'string' ? form.studyGoals.split(',').map(g => g.trim()).filter(g => g) : form.studyGoals,
      });
      await refreshUser();
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = () => {
    setShowAvatarModal(true);
  };

  const onSelectFile = () => {
    fileInput.current?.click();
  };

  const onUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      await userAPI.uploadAvatar(file);
      await refreshUser();
      setShowAvatarModal(false);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Avatar upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const confirmAvatarUpload = () => {
    const file = fileInput.current?.files?.[0];
    if (file && avatarPreview) {
      uploadAvatar(file);
    }
  };

  const avatarSrc = (user as any)?.profileImage || (user as any)?.avatar || '/images/default-avatar.png';

  const getThemeColors = (theme: string) => {
    const themes = {
      default: { primary: 'bg-blue-500', secondary: 'bg-blue-100', text: 'text-blue-600' },
      blue: { primary: 'bg-blue-600', secondary: 'bg-blue-100', text: 'text-blue-700' },
      green: { primary: 'bg-green-600', secondary: 'bg-green-100', text: 'text-green-700' },
      purple: { primary: 'bg-purple-600', secondary: 'bg-purple-100', text: 'text-purple-700' },
      orange: { primary: 'bg-orange-600', secondary: 'bg-orange-100', text: 'text-orange-700' },
      dark: { primary: 'bg-gray-800', secondary: 'bg-gray-100', text: 'text-gray-800' }
    };
    return themes[theme as keyof typeof themes] || themes.default;
  };

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const tabs = [
    { id: 'basic', label: 'Temel Bilgiler', icon: 'fas fa-user' },
    ...(isTeacher ? [
      { id: 'teaching', label: 'Öğretmenlik', icon: 'fas fa-chalkboard-teacher' },
      { id: 'professional', label: 'Profesyonel', icon: 'fas fa-briefcase' }
    ] : []),
    ...(isStudent ? [
      { id: 'learning', label: 'Öğrenme', icon: 'fas fa-graduation-cap' },
      { id: 'preferences', label: 'Tercihler', icon: 'fas fa-cog' }
    ] : []),
    { id: 'customization', label: 'Özelleştirme', icon: 'fas fa-palette' }
  ];

  return (
    <DashboardLayout allowedRoles={['teacher', 'student']} title="Profil">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex flex-col items-center sm:items-start">
              <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-blue-100 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center cursor-pointer" onClick={onPickAvatar}>
                  <i className="fas fa-camera text-white opacity-0 hover:opacity-100 transition-opacity duration-200"></i>
                </div>
              </div>
              <button
                onClick={onPickAvatar}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors duration-200 shadow-md"
              >
                {uploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <i className="fas fa-camera mr-2"></i>
                    Fotoğraf Değiştir
                  </>
                )}
              </button>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onUpload} />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user?.name}</h1>
              <p className="text-lg text-blue-600 font-semibold mb-2">
                {isTeacher ? 'Öğretmen' : 'Öğrenci'}
              </p>
              <p className="text-gray-600 mb-4">{form.bio || 'Henüz bio eklenmemiş'}</p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                {isTeacher && (
                  <>
                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-star text-yellow-500 mr-1"></i>
                      {(user as any)?.rating?.toFixed(1) || '0.0'} puan
                    </div>
                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-clock mr-1"></i>
                      {(user as any)?.experience || 0} yıl deneyim
                    </div>
                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-users mr-1"></i>
                      {(user as any)?.totalLessons || 0} ders
                    </div>
                  </>
                )}
                {isStudent && (
                  <>
                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-level-up-alt mr-1"></i>
                      {form.englishLevel || 'Seviye belirtilmemiş'}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-book mr-1"></i>
                      {(user as any)?.totalLessonsTaken || 0} ders alındı
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className={`${tab.icon} mr-2`}></i>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <form onSubmit={onSave} className="bg-white rounded-xl shadow-sm p-6">
          {/* Email Verification Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between rounded-lg border p-4 bg-gray-50">
              <div>
                <div className="text-sm font-medium text-gray-900 flex items-center">
                  <i className={`fas ${(user as any)?.emailVerified ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-yellow-500'} mr-2`}></i>
                  E-posta Doğrulama
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {(user as any)?.emailVerified ? 'E-postanız doğrulanmış.' : 'E-postanız henüz doğrulanmamış.'}
                </div>
                {verifyMsg && <div className="text-xs text-gray-700 mt-1">{verifyMsg}</div>}
              </div>
              {!(user as any)?.emailVerified && (
                <button
                  type="button"
                  onClick={async ()=>{
                    try {
                      setVerifying(true);
                      setVerifyMsg('');
                      const res = await api.post('/api/auth/verify-email/request');
                      setVerifyMsg(res.data?.message || 'Doğrulama e-postası gönderildi.');
                    } catch (e: any) {
                      setVerifyMsg(e?.response?.data?.message || 'Doğrulama e-postası gönderilemedi');
                    } finally {
                      setVerifying(false);
                    }
                  }}
                  disabled={verifying}
                  className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white text-sm hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
                >
                  {verifying ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-envelope mr-2"></i>
                      Tekrar Gönder
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-user mr-2"></i>Ad Soyad
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Adınızı ve soyadınızı girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-envelope mr-2"></i>E-posta
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="E-posta adresinizi girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-phone mr-2"></i>Telefon
                </label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Telefon numaranızı girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-birthday-cake mr-2"></i>Doğum Tarihi
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-flag mr-2"></i>Uyruk
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  placeholder="Uyruğunuzu girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-language mr-2"></i>Ana Dil
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={form.nativeLanguage}
                  onChange={(e) => setForm({ ...form, nativeLanguage: e.target.value })}
                  placeholder="Ana dilinizi girin"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-info-circle mr-2"></i>Hakkımda
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Kendiniz hakkında kısa bir açıklama yazın..."
                />
              </div>
            </div>
          )}

          {/* Teacher-specific tabs */}
          {isTeacher && activeTab === 'teaching' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-star mr-2"></i>Uzmanlık Alanları
                </label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.specialties as any} 
                  onChange={(e)=>setForm({ ...form, specialties: e.target.value })}
                  placeholder="Örn: Konuşma, Gramer, İş İngilizcesi (virgülle ayırın)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-clock mr-2"></i>Deneyim (yıl)
                </label>
                <input 
                  type="number" 
                  min={0} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.experience as any} 
                  onChange={(e)=>setForm({ ...form, experience: e.target.value })}
                  placeholder="Kaç yıl öğretmenlik deneyiminiz var?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-dollar-sign mr-2"></i>Saatlik Ücret (USD)
                </label>
                <input 
                  type="number" 
                  min={0} 
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.hourlyRate as any} 
                  onChange={(e)=>setForm({ ...form, hourlyRate: e.target.value })}
                  placeholder="Saatlik ders ücretinizi girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-globe mr-2"></i>Konuştuğunuz Diller
                </label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.languages as any} 
                  onChange={(e)=>setForm({ ...form, languages: e.target.value })}
                  placeholder="Örn: İngilizce, Türkçe, Almanca (virgülle ayırın)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-clock mr-2"></i>Zaman Dilimi
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.timezone} 
                  onChange={(e)=>setForm({ ...form, timezone: e.target.value })}
                >
                  <option value="">Zaman dilimi seçin</option>
                  <option value="Europe/Istanbul">Türkiye (UTC+3)</option>
                  <option value="Europe/London">Londra (UTC+0)</option>
                  <option value="America/New_York">New York (UTC-5)</option>
                  <option value="America/Los_Angeles">Los Angeles (UTC-8)</option>
                  <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-chalkboard-teacher mr-2"></i>Öğretim Tarzı
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows={3}
                  value={form.teachingStyle}
                  onChange={(e) => setForm({ ...form, teachingStyle: e.target.value })}
                  placeholder="Öğretim tarzınızı ve metodlarınızı açıklayın..."
                />
              </div>
            </div>
          )}

          {isTeacher && activeTab === 'professional' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-graduation-cap mr-2"></i>Eğitim
                </label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.education} 
                  onChange={(e)=>setForm({ ...form, education: e.target.value })}
                  placeholder="Eğitim geçmişinizi girin"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-certificate mr-2"></i>Sertifikalar
                </label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.certifications as any} 
                  onChange={(e)=>setForm({ ...form, certifications: e.target.value })}
                  placeholder="Örn: CELTA, DELTA, TESOL (virgülle ayırın)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-file-pdf mr-2"></i>CV URL
                </label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.cvUrl} 
                  onChange={(e)=>setForm({ ...form, cvUrl: e.target.value })} 
                  placeholder="https://..." 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-video mr-2"></i>Tanıtım Video URL
                </label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.introVideoUrl} 
                  onChange={(e)=>setForm({ ...form, introVideoUrl: e.target.value })} 
                  placeholder="https://..." 
                />
              </div>
            </div>
          )}

          {/* Student-specific tabs */}
          {isStudent && activeTab === 'learning' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-level-up-alt mr-2"></i>İngilizce Seviyesi
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.englishLevel} 
                  onChange={(e)=>setForm({ ...form, englishLevel: e.target.value })}
                >
                  <option value="">Seviye seçin</option>
                  <option value="Beginner">Başlangıç</option>
                  <option value="Intermediate">Orta</option>
                  <option value="Advanced">İleri</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-certificate mr-2"></i>CEFR Seviyesi
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.cefrLevel} 
                  onChange={(e)=>setForm({ ...form, cefrLevel: e.target.value })}
                >
                  <option value="">CEFR seviyesi seçin</option>
                  <option value="A1">A1 - Başlangıç</option>
                  <option value="A2">A2 - Temel</option>
                  <option value="B1">B1 - Orta Alt</option>
                  <option value="B2">B2 - Orta Üst</option>
                  <option value="C1">C1 - İleri</option>
                  <option value="C2">C2 - Yeterlik</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-target mr-2"></i>Öğrenme Hedefleri
                </label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.learningGoals as any} 
                  onChange={(e)=>setForm({ ...form, learningGoals: e.target.value })}
                  placeholder="Örn: Konuşma geliştirme, IELTS hazırlığı, İş İngilizcesi (virgülle ayırın)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-heart mr-2"></i>Tercih Edilen Ders Türleri
                </label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.preferredLessonTypes as any} 
                  onChange={(e)=>setForm({ ...form, preferredLessonTypes: e.target.value })}
                  placeholder="Örn: VerbfySpeak, VerbfyGrammar, VerbfyExam (virgülle ayırın)"
                />
              </div>
            </div>
          )}

          {isStudent && activeTab === 'preferences' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-calendar-alt mr-2"></i>Çalışma Programı
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.studySchedule} 
                  onChange={(e)=>setForm({ ...form, studySchedule: e.target.value })}
                >
                  <option value="">Çalışma programı seçin</option>
                  <option value="morning">Sabah (06:00-12:00)</option>
                  <option value="afternoon">Öğleden sonra (12:00-18:00)</option>
                  <option value="evening">Akşam (18:00-24:00)</option>
                  <option value="flexible">Esnek</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-user mr-2"></i>Tercih Edilen Öğretmen Cinsiyeti
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.preferredTeacherGender} 
                  onChange={(e)=>setForm({ ...form, preferredTeacherGender: e.target.value })}
                >
                  <option value="">Tercih yok</option>
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                  <option value="no-preference">Fark etmez</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-comments mr-2"></i>İletişim Tarzı
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.communicationStyle} 
                  onChange={(e)=>setForm({ ...form, communicationStyle: e.target.value })}
                >
                  <option value="">İletişim tarzı seçin</option>
                  <option value="formal">Resmi</option>
                  <option value="casual">Samimi</option>
                  <option value="encouraging">Teşvik edici</option>
                  <option value="direct">Doğrudan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-battery-three-quarters mr-2"></i>Motivasyon Seviyesi
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.motivationLevel} 
                  onChange={(e)=>setForm({ ...form, motivationLevel: e.target.value })}
                >
                  <option value="">Motivasyon seviyesi seçin</option>
                  <option value="high">Yüksek</option>
                  <option value="medium">Orta</option>
                  <option value="low">Düşük</option>
                  <option value="variable">Değişken</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-bullseye mr-2"></i>Çalışma Hedefleri
                </label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  value={form.studyGoals as any} 
                  onChange={(e)=>setForm({ ...form, studyGoals: e.target.value })}
                  placeholder="Örn: Günlük 1 saat çalışma, Haftalık 3 ders, Aylık seviye atlama (virgülle ayırın)"
                />
              </div>
            </div>
          )}

          {/* Customization Tab */}
          {activeTab === 'customization' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fas fa-palette mr-2"></i>Profil Teması
                  </label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                    value={form.profileTheme} 
                    onChange={(e)=>setForm({ ...form, profileTheme: e.target.value })}
                  >
                    <option value="default">Varsayılan</option>
                    <option value="blue">Mavi</option>
                    <option value="green">Yeşil</option>
                    <option value="purple">Mor</option>
                    <option value="orange">Turuncu</option>
                    <option value="dark">Koyu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fas fa-eye mr-2"></i>Profil Görünürlüğü
                  </label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                    value={form.profileVisibility} 
                    onChange={(e)=>setForm({ ...form, profileVisibility: e.target.value })}
                  >
                    <option value="public">Herkese Açık</option>
                    <option value="students">Sadece Öğrenciler</option>
                    <option value="teachers">Sadece Öğretmenler</option>
                    <option value="private">Özel</option>
                  </select>
                </div>
              </div>

              {/* Theme Preview */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  <i className="fas fa-eye mr-2"></i>Tema Önizlemesi
                </h4>
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className={`${getThemeColors(form.profileTheme).secondary} rounded-lg p-4`}>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={`w-16 h-16 ${getThemeColors(form.profileTheme).primary} rounded-full flex items-center justify-center`}>
                        <i className="fas fa-user text-white text-xl"></i>
                      </div>
                      <div>
                        <h5 className={`font-semibold ${getThemeColors(form.profileTheme).text}`}>
                          {form.name || 'Adınız Soyadınız'}
                        </h5>
                        <p className="text-gray-600 text-sm">
                          {isTeacher ? 'Öğretmen' : 'Öğrenci'}
                        </p>
                      </div>
                    </div>
                    <div className={`${getThemeColors(form.profileTheme).primary} text-white px-4 py-2 rounded-lg inline-block`}>
                      Örnek Buton
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Color Palette */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  <i className="fas fa-swatchbook mr-2"></i>Tema Renk Paleti
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {['default', 'blue', 'green', 'purple', 'orange', 'dark'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setForm({ ...form, profileTheme: theme })}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        form.profileTheme === theme 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-full h-8 ${getThemeColors(theme).primary} rounded mb-2`}></div>
                      <div className={`w-full h-4 ${getThemeColors(theme).secondary} rounded mb-2`}></div>
                      <p className="text-xs font-medium text-gray-700 capitalize">
                        {theme === 'default' ? 'Varsayılan' : 
                         theme === 'blue' ? 'Mavi' :
                         theme === 'green' ? 'Yeşil' :
                         theme === 'purple' ? 'Mor' :
                         theme === 'orange' ? 'Turuncu' :
                         theme === 'dark' ? 'Koyu' : theme}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Değişiklikleri Kaydet
                </>
              )}
            </button>
          </div>
        </form>
      </div>

        {/* Avatar Upload Modal */}
        {showAvatarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Profil Fotoğrafı Değiştir</h3>
                <button 
                  onClick={() => {
                    setShowAvatarModal(false);
                    setAvatarPreview(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden ring-4 ring-blue-100 shadow-lg mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={avatarPreview || avatarSrc} 
                    alt="Avatar Preview" 
                    className="w-full h-full object-cover" 
                  />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={onSelectFile}
                    className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                  >
                    <i className="fas fa-upload mr-2"></i>
                    Dosya Seç
                  </button>

                  {avatarPreview && (
                    <button
                      onClick={confirmAvatarUpload}
                      disabled={uploading}
                      className="w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Yükleniyor...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check mr-2"></i>
                          Kaydet
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowAvatarModal(false);
                      setAvatarPreview(null);
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors duration-200"
                  >
                    İptal
                  </button>
                </div>

                <input 
                  ref={fileInput} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={onUpload} 
                />

                <p className="text-xs text-gray-500 mt-3">
                  Desteklenen formatlar: JPG, PNG, GIF (Max 5MB)
                </p>
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  );
}

export default ProfilePage;