import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { reservationAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function ReservationsPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await reservationAPI.getReservations({ limit: 20 });
        setItems(res.data?.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout title={t('reservations.title','My Reservations')}>
      {loading ? (
        <div className="p-8 text-center text-gray-500">{t('common.loading','Loading...')}</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-gray-500">{t('reservations.empty','No reservations yet')}</div>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border bg-white">
          {items.map((r: any) => (
            <li key={r._id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{r.title || t('home.lesson','Lesson')}</div>
                <div className="text-sm text-gray-600">{new Date(r.startTime || r.date).toLocaleString()}</div>
              </div>
              <div className="text-sm text-gray-600">{r.status || 'upcoming'}</div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}


