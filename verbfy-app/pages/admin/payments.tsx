import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type AdminPayment = {
  _id: string;
  amount: number;
  currency?: string;
  status: string;
  user?: { _id: string; name: string; email: string };
  createdAt?: string;
};

export default function AdminPaymentsPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getPayments({ search: q, status });
      setItems((res as any).data?.payments ?? (res as any).data ?? (res as any).payments ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [q, status]);

  const refund = async (id: string) => {
    try { await adminAPI.refundPayment(id, {}); await load(); } catch {}
  };

  return (
    <DashboardLayout allowedRoles={['admin']} title={t('admin.payments.title','Admin • Payments')}>
      <div className="flex items-center gap-2 mb-4">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder={t('admin.search','Search...')}
          className="w-full sm:w-80 border rounded-md px-3 py-2" />
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border rounded-md px-3 py-2">
          <option value="all">{t('admin.all','All')}</option>
          <option value="succeeded">{t('admin.succeeded','Succeeded')}</option>
          <option value="refunded">{t('admin.refunded','Refunded')}</option>
          <option value="failed">{t('admin.failed','Failed')}</option>
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">{t('common.loading','Loading...')}</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-gray-500">{t('admin.payments.empty','No payments')}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <Th>{t('admin.user','User')}</Th>
                <Th>{t('admin.payments.amount','Amount')}</Th>
                <Th>{t('admin.status','Status')}</Th>
                <Th>{t('admin.created','Created')}</Th>
                <Th className="text-right">{t('admin.actions','Actions')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <Td>
                    <div className="font-medium text-gray-900">{p.user?.name || '-'}</div>
                    <div className="text-xs text-gray-500">{p.user?.email}</div>
                  </Td>
                  <Td>{(p.amount/100).toFixed(2)} {p.currency?.toUpperCase() || 'USD'}</Td>
                  <Td>
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{p.status}</span>
                  </Td>
                  <Td>{p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</Td>
                  <Td className="text-right">
                    {p.status === 'succeeded' && (
                      <button onClick={()=>refund(p._id)} className="px-3 py-1 rounded-md text-xs bg-red-600 text-white hover:bg-red-700">
                        {t('admin.refund','Refund')}
                      </button>
                    )}
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


