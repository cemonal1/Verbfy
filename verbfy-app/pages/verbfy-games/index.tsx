import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useI18n } from '@/lib/i18n';
import { gamesAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type Game = {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  category?: string; // Vocabulary, Grammar, Listening, etc.
  level?: string; // A1..C2
  thumbnailUrl?: string;
  gameUrl?: string; // public URL (iframe) or internal route
  createdAt?: string;
};

// Temporary in-memory store (replace with API when backend is ready)
const localGamesKey = 'verbfy_games_store';
const loadLocalGames = (): Game[] => {
  try {
    const raw = localStorage.getItem(localGamesKey);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const saveLocalGames = (arr: Game[]) => localStorage.setItem(localGamesKey, JSON.stringify(arr));

export default function VerbfyGamesPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Game>({ title: '', description: '', category: '', level: '', thumbnailUrl: '', gameUrl: '' });
  const [preview, setPreview] = useState<Game | null>(null);

  const categories = useMemo(() => ['Vocabulary', 'Grammar', 'Listening', 'Reading', 'Speaking', 'Exam'], []);
  const levels = useMemo(() => ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], []);

  useEffect(() => {
    let abort = false;
    const run = async () => {
      try {
        const res = await gamesAPI.list({ category, level, search });
        const arr = (res as any)?.data?.data || [];
        if (!abort) setGames(arr);
      } catch {
        // Fallback to local for safety
        if (!abort) setGames(loadLocalGames());
      }
    };
    run();
    return () => { abort = true; };
  }, [category, level, search]);

  const filtered = games.filter((g) => {
    const s = search.trim().toLowerCase();
    return (
      (!category || g.category === category) &&
      (!level || g.level === level) &&
      (!s || g.title.toLowerCase().includes(s) || (g.description || '').toLowerCase().includes(s))
    );
  });

  const addGame = async () => {
    if (!form.title || !form.gameUrl) return;
    try {
      const res = await gamesAPI.create(form as any);
      const created = (res as any)?.data?.data;
      if (created) {
        setGames((x) => [created, ...x]);
      }
    } catch {
      // Fallback to local if API fails
      const id = `${Date.now()}`;
      const newGame = { ...form, id, _id: id, createdAt: new Date().toISOString() } as Game;
      const next = [newGame, ...games];
      setGames(next);
      saveLocalGames(next);
    } finally {
      setShowAdd(false);
      setForm({ title: '', description: '', category: '', level: '', thumbnailUrl: '', gameUrl: '' });
    }
  };

  const removeGame = async (id: string) => {
    try {
      await gamesAPI.delete(id);
      setGames((x) => x.filter((g) => (g._id || g.id) !== id));
    } catch {
      const next = games.filter((g) => (g._id || g.id) !== id);
      setGames(next);
      saveLocalGames(next);
    }
  };

  return (
    <DashboardLayout allowedRoles={['student', 'teacher', 'admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">VerbfyGames</h1>
          <p className="text-gray-600 mt-2">
            {locale === 'tr'
              ? 'Tarayıcı üzerinden oynanabilen öğretici mini oyunlar. Kelime, gramer, dinleme ve daha fazlası.'
              : 'Browser-based learning mini games. Vocabulary, grammar, listening and more.'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 sm:items-center">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={locale === 'tr' ? 'Ara...' : 'Search...'} className="w-full sm:w-auto flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">{locale === 'tr' ? 'Tüm kategoriler' : 'All categories'}</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">{locale === 'tr' ? 'Tüm seviyeler' : 'All levels'}</option>
            {levels.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {isAdmin && (
            <button onClick={() => setShowAdd(true)} className="ml-auto px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">{locale === 'tr' ? 'Yeni Oyun Ekle' : 'Add Game'}</button>
          )}
        </div>

        {/* Add dialog */}
        {isAdmin && showAdd && (
          <div className="mb-6 border border-blue-200 rounded-xl p-4 bg-blue-50">
            <h2 className="font-semibold mb-3">{locale === 'tr' ? 'Yeni Oyun' : 'New Game'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={locale === 'tr' ? 'Başlık' : 'Title'} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder={locale === 'tr' ? 'Görsel URL' : 'Thumbnail URL'} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input value={form.gameUrl} onChange={(e) => setForm({ ...form, gameUrl: e.target.value })} placeholder={locale === 'tr' ? 'Oyun URL (iframe)' : 'Game URL (iframe)'} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">{locale === 'tr' ? 'Kategori' : 'Category'}</option>
                {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">{locale === 'tr' ? 'Seviye' : 'Level'}</option>
                {levels.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </div>
            <div className="mt-3 flex gap-3">
              <button onClick={addGame} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">{locale === 'tr' ? 'Kaydet' : 'Save'}</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-md border border-gray-300">{locale === 'tr' ? 'İptal' : 'Cancel'}</button>
            </div>
          </div>
        )}

        {/* Games */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((g) => {
            const id = g._id || g.id || g.title;
            return (
              <div key={id as string} className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="relative h-40">
                  <Image src={g.thumbnailUrl || '/images/verbfy-listen.png'} alt={g.title} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-200" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{g.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{g.description}</p>
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                    <span>{g.category || '-'} · {g.level || '-'}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setPreview(g)} className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50">{locale === 'tr' ? 'Önizle' : 'Preview'}</button>
                      {isAdmin && (
                        <button onClick={() => removeGame(id as string)} className="px-3 py-1 rounded-md border border-red-300 text-red-600 hover:bg-red-50">{locale === 'tr' ? 'Sil' : 'Delete'}</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preview modal */}
        {preview && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setPreview(null)}>
            <div className="bg-white rounded-xl w-[95vw] h-[85vh] max-w-5xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-3 flex items-center justify-between border-b border-gray-200">
                <p className="font-semibold">{preview.title}</p>
                <button onClick={() => setPreview(null)} className="px-3 py-1 rounded-md border border-gray-300">{locale === 'tr' ? 'Kapat' : 'Close'}</button>
              </div>
              <iframe src={preview.gameUrl} title={preview.title} className="w-full h-full" allowFullScreen />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


