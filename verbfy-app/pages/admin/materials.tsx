import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type AdminMaterial = {
  _id: string;
  title: string;
  description?: string;
  level?: string;
  category?: string;
  uploadedBy?: { _id: string; name: string };
  approved?: boolean;
  createdAt?: string;
};

export default function AdminMaterialsPage() {
  const { t } = useI18n();
  const [materials, setMaterials] = useState<AdminMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all'|'approved'|'pending'>('all');

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getMaterials({ search: q, status });
      setMaterials((res as any).data?.materials ?? (res as any).data ?? (res as any).materials ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [q, status]);

  const approve = async (id: string, approved: boolean) => {
    try {
      await adminAPI.approveMaterial(id, { approved });
      await load();
    } catch {}
  };

  const remove = async (id: string) => {
    try {
      await adminAPI.deleteMaterial(id);
      setMaterials(prev => prev.filter(m => m._id !== id));
    } catch {}
  };

  return (
    <DashboardLayout allowedRoles={['admin']} title={t('admin.materials.title','Admin • Materials')}>
      <div className="flex items-center gap-2 mb-4">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder={t('admin.search','Search...')}
          className="w-full sm:w-80 border rounded-md px-3 py-2" />
        <select value={status} onChange={(e)=>setStatus(e.target.value as any)} className="border rounded-md px-3 py-2">
          <option value="all">{t('admin.all','All')}</option>
          <option value="pending">{t('admin.pending','Pending')}</option>
          <option value="approved">{t('admin.approved','Approved')}</option>
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">{t('common.loading','Loading...')}</div>
      ) : materials.length === 0 ? (
        <div className="p-8 text-center text-gray-500">{t('admin.materials.empty','No materials')}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <Th>{t('admin.materials.titleCol','Title')}</Th>
                <Th>{t('admin.materials.level','Level')}</Th>
                <Th>{t('admin.materials.category','Category')}</Th>
                <Th>{t('admin.materials.uploader','Uploader')}</Th>
                <Th>{t('admin.materials.status','Status')}</Th>
                <Th className="text-right">{t('admin.actions','Actions')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.map((m) => (
                <tr key={m._id} className="hover:bg-gray-50">
                  <Td>
                    <div className="font-medium text-gray-900">{m.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{m.description}</div>
                  </Td>
                  <Td>{m.level || '-'}</Td>
                  <Td>{m.category || '-'}</Td>
                  <Td>{m.uploadedBy?.name || '-'}</Td>
                  <Td>
                    {m.approved ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">{t('admin.approved','Approved')}</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">{t('admin.pending','Pending')}</span>
                    )}
                  </Td>
                  <Td className="text-right space-x-2">
                    {!m.approved && (
                      <button onClick={()=>approve(m._id, true)} className="px-3 py-1 rounded-md text-xs bg-green-600 text-white hover:bg-green-700">
                        {t('admin.materials.approve','Approve')}
                      </button>
                    )}
                    {m.approved && (
                      <button onClick={()=>approve(m._id, false)} className="px-3 py-1 rounded-md text-xs bg-yellow-600 text-white hover:bg-yellow-700">
                        {t('admin.materials.reject','Unapprove')}
                      </button>
                    )}
                    <button onClick={()=>remove(m._id)} className="px-3 py-1 rounded-md text-xs bg-red-600 text-white hover:bg-red-700">
                      {t('admin.delete','Delete')}
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${className}`}>{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2 text-sm text-gray-800 ${className}`}>{children}</td>;
}


