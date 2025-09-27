import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type AuditLog = {
  _id: string;
  action: string;
  actor?: { _id: string; name: string; email: string };
  target?: string;
  metadata?: any;
  createdAt?: string;
};

export default function AdminLogsPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getLogs({ search: q, page, limit: 20 });
      setItems((res as any).data?.logs ?? (res as any).data ?? (res as any).logs ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [q, page]);

  return (
    <DashboardLayout allowedRoles={['admin']} title={t('admin.logs.title','Admin • Logs')}>
      <div className="flex items-center gap-2 mb-4">
        <input value={q} onChange={(e)=>{ setQ(e.target.value); setPage(1); }} placeholder={t('admin.search','Search...')}
          className="w-full sm:w-80 border rounded-md px-3 py-2" />
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">{t('common.loading','Loading...')}</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-gray-500">{t('admin.logs.empty','No logs')}</div>
      ) : (
        <div className="space-y-2">
          {items.map((log) => (
            <div key={log._id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</div>
                <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{log.action}</div>
              </div>
              <div className="mt-2 text-gray-800">
                <span className="font-medium">{log.actor?.name || '-'}</span> → <span className="text-gray-600">{log.target || '-'}</span>
              </div>
              {log.metadata && (
                <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40 bg-gray-50 p-2 rounded">{JSON.stringify(log.metadata, null, 2)}</pre>
              )}
            </div>
          ))}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={()=>setPage(Math.max(1, page-1))} className="px-3 py-1 rounded border disabled:opacity-50" disabled={page===1}>{t('admin.prev','Prev')}</button>
            <span className="text-sm text-gray-600">{t('admin.page','Page')} {page}</span>
            <button onClick={()=>setPage(page+1)} className="px-3 py-1 rounded border">{t('admin.next','Next')}</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}


