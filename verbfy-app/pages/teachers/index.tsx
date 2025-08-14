import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { adminAPI } from '@/lib/api';

export default function TeachersPage() {
  const { t } = useI18n();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminAPI.getUsers({ role: 'teacher', search: q, limit: 12 });
        setTeachers(res.data?.data?.users ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [q]);

  return (
    <DashboardLayout title={t('teachers.title','Find Teachers')}>
      <div className="mb-4 flex items-center gap-2">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder={t('teachers.search','Search teachers')}
          className="w-full sm:w-80 border rounded-md px-3 py-2" />
      </div>
      {loading ? (
        <div className="p-8 text-center text-gray-500">{t('common.loading','Loading...')}</div>
      ) : teachers.length === 0 ? (
        <div className="p-8 text-center text-gray-500">{t('teachers.empty','No teachers found')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((tch: any) => (
            <Link key={tch._id} href={`/teachers/${tch._id}`} className="p-4 rounded-lg border hover:shadow-sm">
              <div className="font-medium text-gray-900">{tch.name}</div>
              <div className="text-sm text-gray-600">{tch.education || 'Teacher'}</div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}


