import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { freeMaterialsAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type FreeMaterial = {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  thumbnailUrl?: string;
};

export default function VerbfyListenPage() {
  const { t, locale } = useI18n();
  const [materials, setMaterials] = useState<FreeMaterial[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string, FreeMaterial>>({});

  const category = useMemo(() => 'Listening', []);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        const levelResp = await freeMaterialsAPI.getLevels();
        if (isMounted && Array.isArray(levelResp?.data)) setLevels(levelResp.data);
      } catch {}
    };
    run();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let abort = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await freeMaterialsAPI.getMaterials({ category, level, search });
        if (!abort) setMaterials(res?.data || res || []);
      } catch {
        if (!abort) setMaterials([]);
      } finally {
        if (!abort) setLoading(false);
      }
    };
    load();
    return () => {
      abort = true;
    };
  }, [category, level, search]);

  const toggleSelect = (m: FreeMaterial) => {
    const id = (m as any)._id || (m as any).id || m.title;
    setSelected((prev) => {
      const next = { ...prev } as Record<string, FreeMaterial>;
      if (next[id]) delete next[id];
      else next[id] = m;
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>VerbfyListen</title>
      </Head>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">VerbfyListen</h1>
          <p className="text-gray-600 mt-2">
            {locale === 'tr'
              ? 'Podcast\'ler, gerçek yaşam diyalogları ve aksan çeşitliliğiyle dinleme pratiği yapın.'
              : 'Practice listening with podcasts, real-life dialogues and accent diversity.'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === 'tr' ? 'Ara...' : 'Search...'}
            className="w-full sm:w-auto flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{locale === 'tr' ? 'Tüm seviyeler' : 'All levels'}</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Selection summary */}
        {Object.keys(selected).length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="font-semibold mb-2">
              {locale === 'tr' ? 'Seçtiklerim' : 'My selection'} ({Object.keys(selected).length})
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.values(selected).map((m) => (
                <span key={(m as any)._id || (m as any).id || m.title} className="px-2 py-1 text-sm bg-white border border-gray-200 rounded-md">
                  {m.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Materials */}
        {loading ? (
          <p className="text-gray-600">{locale === 'tr' ? 'Yükleniyor...' : 'Loading...'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(materials || []).map((m) => {
              const id = (m as any)._id || (m as any).id || m.title;
              const isSel = !!selected[id];
              return (
                <div key={id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="relative h-40">
                    <Image
                      src={m.thumbnailUrl || '/images/verbfy-listen.png'}
                      alt={m.title}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{m.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{m.description}</p>
                    <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                      <span>{m.level || '-'}</span>
                      <button
                        onClick={() => toggleSelect(m)}
                        className={`px-3 py-1 rounded-md border ${
                          isSel ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {isSel ? (locale === 'tr' ? 'Seçildi' : 'Selected') : (locale === 'tr' ? 'Seç' : 'Select')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}


