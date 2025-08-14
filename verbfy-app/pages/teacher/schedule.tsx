import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { availabilityAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/lib/i18n';

export default function TeacherSchedulePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [editing, setEditing] = useState<{
    id: string;
    date: string;
    time: string;
    duration: number;
  } | null>(null);

  const load = async () => {
    if (!user?._id) return;
    try {
      const res = await availabilityAPI.getAvailability(user._id);
      setSlots(res.data?.data ?? res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?._id]);

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    const start = new Date(`${date}T${time}:00`);
    try {
      await availabilityAPI.setAvailability({ start, duration });
      setDate(''); setTime('');
      await load();
    } catch {}
  };

  const removeSlot = async (id?: string) => {
    if (!id) return;
    try {
      await availabilityAPI.deleteAvailability(id);
      setSlots(prev => prev.filter(s => (s._id || s.id) !== id));
    } catch {}
  };

  const startToParts = (d: Date) => ({
    date: d.toISOString().slice(0,10),
    time: d.toTimeString().slice(0,5),
  });

  const startFromParts = (dateStr: string, timeStr: string) => new Date(`${dateStr}T${timeStr}:00`);

  const beginEdit = (s: any) => {
    const start = new Date(s.start || s.date || s);
    const parts = startToParts(start);
    setEditing({ id: s._id || s.id, date: parts.date, time: parts.time, duration: s.duration || 60 });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await availabilityAPI.updateAvailability(editing.id, {
        start: startFromParts(editing.date, editing.time),
        duration: editing.duration,
      });
      setEditing(null);
      await load();
    } catch {}
  };

  return (
    <DashboardLayout allowedRoles={['teacher']} title={t('tschedule.title','My Schedule')}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-lg border p-4 bg-white">
          <div className="text-lg font-semibold mb-3">{t('tschedule.add','Add available slot')}</div>
          <form onSubmit={addSlot} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('tschedule.date','Date')}</label>
              <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('tschedule.time','Time')}</label>
              <input type="time" value={time} onChange={(e)=>setTime(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('tschedule.duration','Duration (min)')}</label>
              <input type="number" min={15} step={15} value={duration} onChange={(e)=>setDuration(parseInt(e.target.value||'60'))} className="w-full border rounded-md px-3 py-2" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{t('tschedule.addBtn','Add Slot')}</button>
          </form>
        </div>
        <div className="lg:col-span-2 rounded-lg border p-4 bg-white">
          <div className="text-lg font-semibold mb-3">{t('tschedule.list','Upcoming availability')}</div>
          {loading ? (
            <div className="p-6 text-center text-gray-500">{t('common.loading','Loading...')}</div>
          ) : slots.length === 0 ? (
            <div className="p-6 text-center text-gray-500">{t('tschedule.empty','No availability yet')}</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {slots.map((s: any, idx: number) => {
                const start = new Date(s.start || s.date || s);
                const label = `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
                const isEditing = !!editing && editing.id === (s._id || s.id);
                return (
                  <li key={s._id || idx} className="py-3 flex items-center justify-between">
                    <div className="text-gray-800">
                      {isEditing ? (
                        <form onSubmit={saveEdit} className="flex items-center gap-2">
                          <input
                            type="date"
                            value={editing?.date ?? ''}
                            onChange={(e)=>setEditing(prev => prev ? { ...prev, date: e.target.value } : prev)}
                            className="border rounded px-2 py-1 text-sm"
                            required
                          />
                          <input
                            type="time"
                            value={editing?.time ?? ''}
                            onChange={(e)=>setEditing(prev => prev ? { ...prev, time: e.target.value } : prev)}
                            className="border rounded px-2 py-1 text-sm"
                            required
                          />
                          <input
                            type="number"
                            min={15}
                            step={15}
                            value={editing?.duration ?? 60}
                            onChange={(e)=>setEditing(prev => prev ? { ...prev, duration: parseInt(e.target.value || '60') } : prev)}
                            className="w-24 border rounded px-2 py-1 text-sm"
                          />
                          <button type="submit" className="px-3 py-1 rounded-md text-xs bg-blue-600 text-white hover:bg-blue-700">{t('common.save','Save')}</button>
                          <button type="button" onClick={()=>setEditing(null)} className="px-3 py-1 rounded-md text-xs bg-gray-200 text-gray-800 hover:bg-gray-300">{t('common.cancel','Cancel')}</button>
                        </form>
                      ) : (
                        label
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => beginEdit(s)} className="px-3 py-1 rounded-md text-xs bg-gray-100 text-gray-800 hover:bg-gray-200">
                        {t('common.edit','Edit')}
                      </button>
                      <button onClick={() => removeSlot(s._id || s.id)} className="px-3 py-1 rounded-md text-xs bg-red-600 text-white hover:bg-red-700">
                        {t('common.delete','Delete')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


