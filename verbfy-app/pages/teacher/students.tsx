import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useI18n } from '@/lib/i18n';
import { adminAPI } from '@/lib/api';

export default function TeacherStudentsPage() {
  const { t } = useI18n();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminAPI.getUsers({ role: 'student', limit: 20 });
        setStudents(res.data?.data?.users ?? []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <DashboardLayout allowedRoles={['teacher']} title={t('tstudents.title','My Students')}>
      {loading ? (
        <div className="p-8 text-center text-gray-500">{t('common.loading','Loading...')}</div>
      ) : students.length === 0 ? (
        <div className="p-8 text-center text-gray-500">{t('tstudents.empty','No students yet')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s: any) => (
            <div key={s._id} className="p-4 rounded-lg border bg-white">
              <div className="font-medium text-gray-900">{s.name}</div>
              <div className="text-sm text-gray-600">{s.email}</div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}