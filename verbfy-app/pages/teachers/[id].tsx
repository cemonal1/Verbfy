import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useI18n } from '@/lib/i18n';
import api, { availabilityAPI, reservationAPI } from '@/lib/api';

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
  certifications?: string[];
  timezone?: string;
  nativeLanguage?: string;
  createdAt: string;
}

export default function TeacherDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const { t } = useI18n();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [booking, setBooking] = useState<{slotId?: string, actualDate?: string, startTime?: string, endTime?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        
        // Load teacher details using the new endpoint
        const teacherRes = await api.get(`/api/users/teachers/${id}`);
        setTeacher(teacherRes.data?.data ?? null);

        // Load availability
        try {
          const availabilityRes = await availabilityAPI.getAvailability(id as string);
          setSlots(availabilityRes.data?.data ?? availabilityRes.data ?? []);
        } catch (availError) {
          console.error('Error loading availability:', availError);
          setSlots([]);
        }
      } catch (error) {
        console.error('Error loading teacher:', error);
        setTeacher(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const nextDays = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      return d;
    });
  }, []);

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

  const handleBookLesson = async () => {
    if (!booking || !id) return;
    
    try {
      setBookingLoading(true);
      
      await reservationAPI.createReservation({
        teacherId: id,
        slotId: booking.slotId,
        actualDate: booking.actualDate,
        lessonType: 'VerbfySpeak',
        lessonLevel: 'Intermediate',
        notes: 'Booked via teacher profile'
      });
      
      setBooking(null);
      alert(t('teachers.booked','Lesson booked successfully! Check your reservations.'));
      
      // Reload availability to reflect the booking
      try {
        const availabilityRes = await availabilityAPI.getAvailability(id as string);
        setSlots(availabilityRes.data?.data ?? availabilityRes.data ?? []);
      } catch (reloadError) {
        console.error('Error reloading availability:', reloadError);
      }
      
    } catch (error: any) {
      console.error('Error booking lesson:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Could not book lesson';
      alert(t('teachers.bookError', errorMessage));
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title={t('teachers.detail','Teacher')}>
        <div className="p-8 text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          {t('common.loading','Loading...')}
        </div>
      </DashboardLayout>
    );
  }

  if (!teacher) {
    return (
      <DashboardLayout title={t('teachers.detail','Teacher')}>
        <div className="p-8 text-center text-gray-500">
          <div className="text-lg mb-2">{t('teachers.notFound','Teacher not found')}</div>
          <div className="text-sm">{t('teachers.notFoundDesc','This teacher may not be approved or may not exist.')}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={teacher.name}>
      <div className="space-y-6">
        {/* Teacher Profile Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {teacher.profileImage ? (
                <img 
                  src={teacher.profileImage} 
                  alt={teacher.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-2xl">
                    {teacher.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{teacher.name}</h1>
              
              {teacher.education && (
                <div className="text-lg text-gray-600 mb-2">{teacher.education}</div>
              )}
              
              {teacher.rating && teacher.rating > 0 && (
                <div className="flex items-center mb-3">
                  <div className="flex mr-2">
                    {renderStars(teacher.rating)}
                  </div>
                  <span className="text-sm text-gray-600">
                    {teacher.rating.toFixed(1)} ({teacher.totalLessons || 0} lessons completed)
                  </span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {teacher.experience && (
                  <div>
                    <span className="font-medium text-gray-700">Experience:</span>
                    <span className="ml-2 text-gray-600">{teacher.experience} years</span>
                  </div>
                )}
                
                {teacher.nativeLanguage && (
                  <div>
                    <span className="font-medium text-gray-700">Native Language:</span>
                    <span className="ml-2 text-gray-600">{teacher.nativeLanguage}</span>
                  </div>
                )}
                
                {teacher.languages && teacher.languages.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Speaks:</span>
                    <span className="ml-2 text-gray-600">{teacher.languages.join(', ')}</span>
                  </div>
                )}
                
                {teacher.timezone && (
                  <div>
                    <span className="font-medium text-gray-700">Timezone:</span>
                    <span className="ml-2 text-gray-600">{teacher.timezone}</span>
                  </div>
                )}
              </div>
              
              {teacher.hourlyRate && (
                <div className="mt-3">
                  <span className="text-xl font-bold text-green-600">${teacher.hourlyRate}/hour</span>
                </div>
              )}
            </div>
          </div>
          
          {teacher.bio && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">About</h3>
              <p className="text-gray-600 leading-relaxed">{teacher.bio}</p>
            </div>
          )}
          
          {teacher.specialties && teacher.specialties.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {teacher.specialties.map((specialty, index) => (
                  <span 
                    key={index}
                    className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {teacher.certifications && teacher.certifications.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Certifications</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {teacher.certifications.map((cert, index) => (
                  <li key={index}>{cert}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Availability Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('teachers.availability','Available Time Slots (Next 7 Days)')}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {nextDays.map((day) => {
              const dayStr = day.toDateString();
              const daySlots = (slots || []).filter((slot: any) => {
                if (!slot.isBooked) {
                  // Check if this slot matches the day
                  const slotDate = new Date(day);
                  const slotDayOfWeek = slotDate.getDay();
                  return slot.dayOfWeek === slotDayOfWeek;
                }
                return false;
              });
              
              return (
                <div key={dayStr} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-medium text-gray-900 mb-3">
                    {day.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  
                  <div className="space-y-2">
                    {daySlots.length === 0 ? (
                      <span className="text-sm text-gray-500">
                        {t('teachers.noSlots','No available slots')}
                      </span>
                    ) : (
                      daySlots.map((slot: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setBooking({
                            slotId: slot._id,
                            actualDate: day.toISOString().split('T')[0],
                            startTime: slot.startTime,
                            endTime: slot.endTime
                          })}
                          className="w-full text-sm px-3 py-2 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          {slot.startTime} - {slot.endTime}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Booking Confirmation */}
        {booking && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 mb-3">
              {t('teachers.confirmBooking','Confirm Lesson Booking')}
            </h3>
            
            <div className="space-y-2 text-sm text-blue-800 mb-4">
              <div><strong>Teacher:</strong> {teacher.name}</div>
              <div><strong>Date:</strong> {new Date(booking.actualDate!).toLocaleDateString()}</div>
              <div><strong>Time:</strong> {booking.startTime} - {booking.endTime}</div>
              <div><strong>Type:</strong> VerbfySpeak (Conversation Practice)</div>
              <div><strong>Level:</strong> Intermediate</div>
              {teacher.hourlyRate && (
                <div><strong>Rate:</strong> ${teacher.hourlyRate}/hour</div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleBookLesson}
                disabled={bookingLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {bookingLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {t('teachers.confirmBook','Confirm Booking')}
              </button>
              
              <button
                onClick={() => setBooking(null)}
                disabled={bookingLoading}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                {t('common.cancel','Cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


