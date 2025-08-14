import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useI18n } from '@/lib/i18n';
import { adminAPI, reservationAPI, availabilityAPI } from '@/lib/api';

export default function TeacherDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const { t } = useI18n();
  const [teacher, setTeacher] = useState<any | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [booking, setBooking] = useState<{start?: string}|null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await adminAPI.getUserById(id);
        setTeacher(res.data?.data ?? null);
      } catch {}

      try {
        const av = await availabilityAPI.getAvailability(id as string);
        setSlots(av.data?.data ?? av.data ?? []);
      } catch {}
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

  return (
    <DashboardLayout title={teacher?.name || t('teachers.detail','Teacher')}>
      {!teacher ? (
        <div className="p-8 text-center text-gray-500">{t('common.loading','Loading...')}</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="text-xl font-semibold">{teacher.name}</div>
            <div className="text-gray-600">{teacher.education || ''}</div>
            <div className="mt-2 text-sm text-gray-600">{teacher.specialties?.join(', ')}</div>
          </div>
          {/* Availability grid */}
          <div className="rounded-lg border p-4 bg-white">
            <div className="text-lg font-medium mb-3">{t('teachers.availability','Availability (next 7 days)')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {nextDays.map((d) => {
                const dayStr = d.toDateString();
                const daySlots = (slots || []).filter((s: any) => {
                  const ts = new Date(s.start || s.date || s).toDateString();
                  return ts === dayStr;
                });
                return (
                  <div key={dayStr} className="border rounded-md p-3">
                    <div className="text-sm font-medium text-gray-900">{d.toLocaleDateString()}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {daySlots.length === 0 ? (
                        <span className="text-xs text-gray-500">{t('teachers.noSlots','No slots')}</span>
                      ) : (
                        daySlots.map((s: any, idx: number) => {
                          const start = new Date(s.start || s.date || s);
                          const label = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          return (
                            <button
                              key={idx}
                              onClick={() => setBooking({ start: start.toISOString() })}
                              className="text-xs px-2 py-1 rounded border hover:bg-blue-50"
                            >
                              {label}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Booking action */}
          {booking?.start && (
            <div className="rounded-lg border p-4 bg-white flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {t('teachers.selected','Selected')}: {new Date(booking.start).toLocaleString()}
              </div>
              <button
                onClick={async () => {
                  try {
                    await reservationAPI.createReservation({ teacherId: id, startTime: booking.start });
                    setBooking(null);
                    alert(t('teachers.booked','Reservation created'));
                  } catch (e) {
                    alert(t('teachers.bookError','Could not create reservation'));
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {t('teachers.book','Book Lesson')}
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}


