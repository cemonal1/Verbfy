import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import api, { cefrTestsAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/context/AuthContext';

export default function PlacementPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    const run = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }
        const [rec, list] = await Promise.all([
          cefrTestsAPI.getPlacementRecommendation().catch(() => null),
          cefrTestsAPI.getTests({ testType: 'placement' }).catch(() => ({ data: [] })),
        ]);
        if (!abort) {
          if (rec && (rec as any).recommendation) setRecommendation((rec as any).recommendation);
          let arr = Array.isArray((list as any)?.tests) ? (list as any).tests : Array.isArray((list as any)?.data) ? (list as any).data : (Array.isArray(list) ? list : []);
          if (!arr || arr.length === 0) {
            try {
              // Use explicit endpoint that guarantees four placement tests
              const ensured = await api.get('/api/cefr-tests/placement/all');
              arr = Array.isArray((ensured.data as any)?.tests) ? (ensured.data as any).tests : [];
            } catch {}
          }
          setTests(arr || []);
        }
      } finally {
        if (!abort) setLoading(false);
      }
    };
    run();
    return () => { abort = true; };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{locale === 'tr' ? 'Seviye Tespit (CEFR)' : 'Placement (CEFR)'}</title>
      </Head>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{locale === 'tr' ? 'Seviye Tespit Sınavı' : 'Placement Test'}</h1>
        {!user && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4">
            {locale==='tr' ? 'Bu sayfa yalnızca kayıtlı kullanıcılara açıktır. Ücretsiz seviye testi için ' : 'This page is only available to registered users. For the free level test go to '}
            <Link href="/level-test/free" className="font-semibold underline">{locale==='tr' ? 'Ücretsiz Seviye Testi' : 'Free Level Test'}</Link>.
          </div>
        )}
        <p className="text-gray-600 mb-6">
          {locale === 'tr'
            ? 'İlk girişte CEFR seviyenizi belirlemek için hızlı bir seviye tespit sınavı çözün. Sonuçlar kişiselleştirilmiş yol haritanızı oluşturmakta kullanılacaktır.'
            : 'On your first visit, take a quick placement test to determine your CEFR level. The result will be used to personalize your learning path.'}
        </p>

        {loading ? (
          <p className="text-gray-600">{locale === 'tr' ? 'Yükleniyor...' : 'Loading...'}</p>
        ) : (
          <>
            {recommendation && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="font-semibold">
                  {locale === 'tr' ? 'Önerilen başlangıç seviyesi: ' : 'Recommended starting level: '}
                  <span className="text-blue-700">{recommendation}</span>
                </p>
              </div>
            )}

            <div className="space-y-4">
              {tests.length > 0 ? (
                tests.map((test: any) => (
                  <div key={test._id || test.id} className="p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{test.title || 'CEFR Placement'}</p>
                      <p className="text-sm text-gray-600">{test.description || (locale === 'tr' ? 'Seviyenizi ölçün' : 'Measure your level')}</p>
                    </div>
                    <Link href={`/cefr-tests/${test._id || test.id}`} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                      {locale === 'tr' ? 'Sınavı Başlat' : 'Start Test'}
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">{locale === 'tr' ? 'Uygun sınav bulunamadı.' : 'No placement test available.'}</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}


