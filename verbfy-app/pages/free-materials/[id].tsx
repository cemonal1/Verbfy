import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { freeMaterialsAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function MaterialDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const { t } = useI18n();
  const [material, setMaterial] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await freeMaterialsAPI.getMaterial(id);
        setMaterial(res.data || res);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <DashboardLayout title={material?.title || t('materials.title','Free Materials')}>
      {loading ? (
        <div className="p-8 text-center text-gray-500">{t('common.loading','Loading...')}</div>
      ) : !material ? (
        <div className="p-8 text-center text-gray-500">{t('materials.empty','No materials found')}</div>
      ) : (
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-2xl font-semibold text-gray-900 mb-2">{material.title}</div>
          <div className="text-gray-600 mb-4">{material.description}</div>
          {material.previewUrl && (
            <iframe src={material.previewUrl} className="w-full h-96 border" />
          )}
          <div className="mt-4 flex gap-2">
            <a href={`/api/free-materials/${id}/download`} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
              {t('materials.download','Download')}
            </a>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}


