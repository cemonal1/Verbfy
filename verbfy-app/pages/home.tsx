import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { notificationAPI, freeMaterialsAPI, verbfyTalkAPI, reservationAPI } from '@/lib/api';

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [unread, setUnread] = useState<number>(0);
  const [featured, setFeatured] = useState<unknown[]>([]);
  const [rooms, setRooms] = useState<unknown[]>([]);
  const [upcoming, setUpcoming] = useState<unknown[]>([]);

  const load = useCallback(async () => {
    try {
      const [n, f, r] = await Promise.all([
        notificationAPI.getNotifications(),
        freeMaterialsAPI.getFeaturedMaterials(),
        verbfyTalkAPI.getRooms({ 
          level: 'All', 
          isPrivate: false, 
          page: 1, 
          limit: 4 
        }),
      ]);
      setUnread(n.data?.data?.unreadCount ?? 0);
      setFeatured((f as { data?: unknown[] }).data ?? []);
      setRooms((r as { data?: { rooms?: unknown[] } }).data?.rooms ?? []);
    } catch (error) {
      console.error('Failed to load home data:', error);
    }

    try {
      const res = await reservationAPI.getReservations({ status: 'upcoming', limit: 5 });
      setUpcoming(res.data?.data ?? []);
    } catch (error) {
      console.error('Failed to load upcoming reservations:', error);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout title={t('home.title', 'Home')}>
      <div className="space-y-8">
        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={t('home.stats.unread', 'Unread notifications')} value={unread} />
          <StatCard label={t('home.stats.upcoming', 'Upcoming lessons')} value={upcoming.length} />
          <StatCard label={t('home.stats.rooms', 'Open talk rooms')} value={rooms.length} />
          <StatCard label={t('home.stats.materials', 'Featured materials')} value={featured.length} />
        </div>

        {/* Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Shortcut href="/teachers" icon="👨‍🏫" title={t('home.shortcut.teachers', 'Find Teachers')} />
          <Shortcut href="/verbfy-talk" icon="🎥" title={t('home.shortcut.talk', 'Join VerbfyTalk')} />
          <Shortcut href="/free-materials" icon="📚" title={t('home.shortcut.materials', 'Free Materials')} />
          <Shortcut href="/cefr-tests" icon="📝" title={t('home.shortcut.cefr', 'CEFR Tests')} />
        </div>

        {/* Upcoming reservations */}
        <Section title={t('home.upcoming', 'Your upcoming lessons')} linkHref="/reservations" linkText={t('home.viewAll', 'View all')}>
          {upcoming.length === 0 ? (
            <Empty text={t('home.upcomingEmpty', 'No upcoming lessons yet')} />
          ) : (
            <ul className="divide-y divide-gray-200 rounded-lg border">
              {upcoming.map((r: any) => (
                <li key={r._id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{r.title || t('home.lesson', 'Lesson')}</div>
                    <div className="text-sm text-gray-600">{new Date(r.startTime || r.date).toLocaleString()}</div>
                  </div>
                  <Link href="/reservations" className="text-blue-600 hover:underline text-sm">{t('home.manage', 'Manage')}</Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Featured materials */}
        <Section title={t('home.featured', 'Featured materials')} linkHref="/free-materials" linkText={t('home.viewAll', 'View all')}>
          {featured.length === 0 ? (
            <Empty text={t('home.materialsEmpty', 'No featured materials yet')} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.slice(0, 6).map((m: any) => (
                <div key={m._id} className="p-4 rounded-lg border hover:shadow-sm transition">
                  <div className="font-medium text-gray-900">{m.title}</div>
                  <div className="text-sm text-gray-600 line-clamp-2">{m.description}</div>
                  <div className="mt-2 text-xs text-gray-500">{m.level} • {m.category}</div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Open rooms */}
        <Section title={t('home.rooms', 'Open VerbfyTalk rooms')} linkHref="/verbfy-talk" linkText={t('home.viewAll', 'View all')}>
          {rooms.length === 0 ? (
            <Empty text={t('home.roomsEmpty', 'No rooms available right now')} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.slice(0, 6).map((room: any) => (
                <div key={room._id} className="p-4 rounded-lg border hover:shadow-sm transition">
                  <div className="font-medium text-gray-900">{room.name || t('home.room', 'Room')}</div>
                  <div className="text-sm text-gray-600">{room.isPrivate ? t('home.private','Private') : t('home.public','Public')}</div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-4 bg-white">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function Shortcut({ href, icon, title }: { href: string; icon: string; title: string }) {
  return (
    <Link href={href} className="rounded-lg border p-4 bg-white flex items-center space-x-3 hover:shadow-sm transition">
      <span className="text-xl" aria-hidden>{icon}</span>
      <span className="font-medium text-gray-900">{title}</span>
    </Link>
  );
}

function Section({ title, linkHref, linkText, children }: { title: string; linkHref: string; linkText: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Link href={linkHref} className="text-sm text-blue-600 hover:underline">{linkText}</Link>
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border p-8 text-center text-gray-500">{text}</div>
  );
}


