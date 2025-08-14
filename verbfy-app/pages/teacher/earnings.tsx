import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useI18n } from '@/lib/i18n';
import { paymentAPI } from '@/lib/api';

export default function TeacherEarningsPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await paymentAPI.getPaymentStats();
        setStats(res.data?.data ?? res.data ?? null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout allowedRoles={['teacher']} title={t('tearnings.title','Earnings')}>
      {loading ? (
        <div className="p-8 text-center text-gray-500">{t('common.loading','Loading...')}</div>
      ) : !stats ? (
        <div className="p-8 text-center text-gray-500">{t('tearnings.empty','No earnings yet')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label={t('tearnings.total','Total Earnings')} value={stats.total || 0} />
          <Stat label={t('tearnings.month','This Month')} value={stats.month || 0} />
          <Stat label={t('tearnings.sessions','Paid Sessions')} value={stats.sessions || 0} />
        </div>
      )}
    </DashboardLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4 bg-white">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}