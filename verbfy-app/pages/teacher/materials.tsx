import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useI18n } from '@/lib/i18n';
import { freeMaterialsAPI } from '@/lib/api';

export default function TeacherMaterialsPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<null | { id: string; title: string; description: string; level: string; category: string }>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res: any = await freeMaterialsAPI.getMaterials({ limit: 30 });
      setItems(res.data ?? res ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <DashboardLayout allowedRoles={['teacher']} title={t('tmaterials.title','My Materials')}>
      <div className="rounded-lg border bg-white p-4 mb-4">
        <div className="text-lg font-semibold mb-3">{t('tmaterials.upload','Upload new material')}</div>
        <UploadForm onUploaded={load} />
      </div>
      {loading ? (
        <div className="p-8 text-center text-gray-500">{t('common.loading','Loading...')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m: any) => (
            <div key={m._id || m.id} className="p-4 rounded-lg border bg-white">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-gray-900">{m.title}</div>
                  <div className="text-sm text-gray-600 line-clamp-2">{m.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>setEditing({ id: m._id || m.id, title: m.title || '', description: m.description || '', level: m.level || 'Beginner', category: m.category || 'General' })} className="px-3 py-1 rounded-md text-xs bg-blue-600 text-white hover:bg-blue-700">{t('common.edit','Edit')}</button>
                  <button onClick={async()=>{ try{ const blob = await freeMaterialsAPI.downloadMaterial(m._id || m.id); const url = window.URL.createObjectURL(blob); window.open(url, '_blank'); } catch{} }} className="px-3 py-1 rounded-md text-xs bg-gray-100 text-gray-800 hover:bg-gray-200">{t('common.preview','Preview')}</button>
                  <button onClick={async()=>{ try{ await freeMaterialsAPI.deleteMaterial(m._id || m.id); setItems(prev=>prev.filter((x:any)=> (x._id||x.id)!==(m._id||m.id))); } catch{} }} className="px-3 py-1 rounded-md text-xs bg-red-600 text-white hover:bg-red-700">{t('common.delete','Delete')}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          initial={editing}
          onClose={()=>setEditing(null)}
          onSave={async (data)=>{
            try { await freeMaterialsAPI.updateMaterial(editing.id, data as any); await load(); setEditing(null); } catch {}
          }}
        />
      )}
    </DashboardLayout>
  );
}

function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [category, setCategory] = useState('General');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    try {
      setSubmitting(true);
      await freeMaterialsAPI.uploadMaterial({ title, description, level, category, file } as any);
      setTitle(''); setDescription(''); setFile(null);
      onUploaded();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm text-gray-700 mb-1">{t('tmaterials.titleLabel','Title')}</label>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">{t('tmaterials.level','Level')}</label>
        <select value={level} onChange={(e)=>setLevel(e.target.value)} className="w-full border rounded-md px-3 py-2">
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-700 mb-1">{t('tmaterials.category','Category')}</label>
        <input value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full border rounded-md px-3 py-2" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-700 mb-1">{t('tmaterials.description','Description')}</label>
        <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full border rounded-md px-3 py-2" rows={3} />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-700 mb-1">{t('tmaterials.file','File')}</label>
        <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} className="block" required />
      </div>
      <div className="md:col-span-2">
        <button disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          {submitting ? t('common.submitting','Submitting...') : t('tmaterials.uploadBtn','Upload')}
        </button>
      </div>
    </form>
  );
}

function EditModal({ initial, onClose, onSave }: { initial: { id: string; title: string; description: string; level: string; category: string }; onClose: ()=>void; onSave: (data: { title: string; description: string; level: string; category: string })=>Promise<void> }) {
  const { t } = useI18n();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [level, setLevel] = useState(initial.level || 'Beginner');
  const [category, setCategory] = useState(initial.category || 'General');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { setSaving(true); await onSave({ title, description, level, category }); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b">
          <div className="text-lg font-semibold">{t('tmaterials.edit','Edit Material')}</div>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('tmaterials.titleLabel','Title')}</label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('tmaterials.level','Level')}</label>
            <select value={level} onChange={(e)=>setLevel(e.target.value)} className="w-full border rounded-md px-3 py-2">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('tmaterials.category','Category')}</label>
            <input value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('tmaterials.description','Description')}</label>
            <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full border rounded-md px-3 py-2" rows={3} />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">{t('common.cancel','Cancel')}</button>
            <button disabled={saving} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">{saving ? t('common.submitting','Submitting...') : t('common.save','Save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}