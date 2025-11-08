import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import api from '@/lib/api';

interface Teacher {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
  specialties?: string[];
  rating?: number;
  totalLessons?: number;
  hourlyRate?: number;
  languages?: string[];
  education?: string;
  experience?: number;
  timezone?: string;
  nativeLanguage?: string;
}

export default function TeachersPage() {
  const { t } = useI18n();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/users/teachers', { 
          params: { search: q, limit: 12, page: 1 } 
        });
        setTeachers(res.data?.teachers ?? []);
        setPagination(res.data?.pagination ?? null);
      } catch (error) {
        console.error('Error loading teachers:', error);
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(load, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [q]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">★</span>);
    }
    
    return stars;
  };

  return (
    <DashboardLayout title={t('teachers.title','Find Teachers')}>
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <input 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder={t('teachers.search','Search teachers by name, specialties, or education')}
            className="w-full sm:w-80 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
        </div>
        
        {pagination && (
          <div className="text-sm text-gray-600">
            {`Showing ${pagination.total} approved teachers`}
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          {t('common.loading','Loading...')}
        </div>
      ) : teachers.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <div className="text-lg mb-2">{t('teachers.empty','No approved teachers found')}</div>
          {q && (
            <div className="text-sm">
              {t('teachers.tryDifferentSearch', 'Try a different search term or browse all teachers')}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <Link 
              key={teacher._id} 
              href={`/teachers/${teacher._id}`} 
              className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 hover:border-blue-300"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {teacher.profileImage ? (
                    <img 
                      src={teacher.profileImage} 
                      alt={teacher.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {teacher.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-lg mb-1 truncate">
                    {teacher.name}
                  </div>
                  
                  {teacher.education && (
                    <div className="text-sm text-gray-600 mb-2 truncate">
                      {teacher.education}
                    </div>
                  )}
                  
                  {teacher.rating && teacher.rating > 0 && (
                    <div className="flex items-center mb-2">
                      <div className="flex mr-2">
                        {renderStars(teacher.rating)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {teacher.rating.toFixed(1)} ({teacher.totalLessons || 0} lessons)
                      </span>
                    </div>
                  )}
                  
                  {teacher.specialties && teacher.specialties.length > 0 && (
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1">
                        {teacher.specialties.slice(0, 2).map((specialty, index) => (
                          <span 
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                        {teacher.specialties.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{teacher.specialties.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {teacher.languages && teacher.languages.length > 0 && (
                    <div className="text-xs text-gray-500 mb-2">
                      {t('teachers.speaks', 'Speaks')}: {teacher.languages.join(', ')}
                    </div>
                  )}
                  
                  {teacher.hourlyRate && (
                    <div className="text-sm font-medium text-green-600">
                      ${teacher.hourlyRate}/hour
                    </div>
                  )}
                  
                  {teacher.experience && (
                    <div className="text-xs text-gray-500 mt-1">
                      {teacher.experience} {t('teachers.yearsExperience', 'years experience')}
                    </div>
                  )}
                </div>
              </div>
              
              {teacher.bio && (
                <div className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {teacher.bio}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}


