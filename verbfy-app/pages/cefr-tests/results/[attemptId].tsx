import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import { cefrTestsAPI } from '@/lib/api';

export default function CEFRTestResultPage() {
  const router = useRouter();
  const { attemptId } = router.query;
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  useEffect(() => {
    if (!attemptId || typeof attemptId !== 'string') return;
    let abort = false;
    const run = async () => {
      try {
        setLoading(true);
        // Prefer immediate sessionStorage payload set by submit flow
        let res: any = null;
        try {
          const cached = typeof window !== 'undefined' ? window.sessionStorage.getItem(`cefr_result_${attemptId}`) : null;
          if (cached) res = JSON.parse(cached);
        } catch {}
        // If not in sessionStorage, we skip backend fetch to avoid 404 on missing endpoint
        if (!abort) setData(res);
      } finally {
        if (!abort) setLoading(false);
      }
    };
    run();
    return () => { abort = true; };
  }, [attemptId]);

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>CEFR Result - Verbfy</title>
      </Head>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Test Sonucu</h1>

        {loading ? (
          <div className="text-gray-600">Yükleniyor...</div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-gray-700">Genel Skor</p>
                  <p className="text-3xl font-bold">{data?.score ?? '--'} / {data?.maxScore ?? '--'}</p>
                </div>
                <div>
                  <p className="text-gray-700">Önerilen CEFR</p>
                  <p className="text-3xl font-bold text-blue-700">{(data as any)?.recommendedLevel ?? (data as any)?.cefrLevel ?? '--'}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-blue-800">Grammar&Use</div>
                  <div className="text-lg font-semibold">{(data as any)?.sectionScores?.grammarUse ?? '--'}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-green-800">Vocabulary</div>
                  <div className="text-lg font-semibold">{(data as any)?.sectionScores?.vocabulary ?? '--'}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-purple-800">Reading</div>
                  <div className="text-lg font-semibold">{(data as any)?.sectionScores?.reading ?? '--'}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-amber-800">Advanced</div>
                  <div className="text-lg font-semibold">{(data as any)?.sectionScores?.advanced ?? '--'}</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>Bağlayıcı kural (sınırda): Öncelik sırası Reading → Grammar → Vocabulary → Advanced.</p>
                {(data as any)?.hasLongWrongStreak && (
                  <p className="text-amber-700 mt-1">6+ ardışık yanlış/boş algılandı: bir seviye aşağıdan başlatma önerildi.</p>
                )}
              </div>
            </div>

            {/* Bilgilendirme Bloğu (CEFR/ALTE) */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Sınav Bilgilendirme</h2>
                <button onClick={() => setShowInfo(!showInfo)} className="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200">
                  {showInfo ? 'Kapat' : 'Detayları Göster'}
                </button>
              </div>
              {showInfo && (
                <div className="mt-4 text-sm text-gray-700 space-y-4">
                  <p>
                    Bu yerleştirme testi CEFR (Avrupa Dilleri Ortak Çerçevesi) düzeyleriyle hizalıdır. Çoktan seçmeli soru formatı, nesnel değerlendirme ve yüksek tutarlılık sağlar.
                    Değerlendirme sonuçları seviyelere dönüştürülür ve eğitim planınıza başlangıç noktası olarak kullanılır.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium mb-2">Örnek Skor Dönüşümü</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">50 soruluk test</p>
                        <ul className="mt-2 space-y-1">
                          <li>0–10 → A1</li>
                          <li>11–20 → A2</li>
                          <li>21–30 → B1</li>
                          <li>31–40 → B2</li>
                          <li>41–46 → C1</li>
                          <li>47–50 → C2</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">60 soruluk test</p>
                        <ul className="mt-2 space-y-1">
                          <li>0–29 → B1</li>
                          <li>30–44 → B2</li>
                          <li>45–55 → C1</li>
                          <li>56–60 → C2</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Bağlayıcı kararlar için Reading → Grammar → Vocabulary → Advanced bölüm skorları önceliklendirilir.</li>
                    <li>Tahmini azaltmak için ardışık 6+ yanlış/boş varsa bir seviye aşağıdan başlatma önerilir.</li>
                    <li>Seviye önerileri CEFR/ALTE kılavuzlarıyla uyumlu olacak şekilde yorumlanır.</li>
                  </ul>
                  <div className="text-xs text-gray-500">
                    Not: CEFR ve ALTE kılavuzları doğrultusunda geliştirilen testler, makineyle puanlanabilir ve geçerlik-güvenirlik ilkelerine göre tasarlanır.
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-3">Yorumlama ve Öneriler</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Genel bant: 0–10 A1, 11–20 A2, 21–30 B1, 31–40 B2, 41–46 C1, 47–50 C2.</li>
                <li>Sınır durumunda (ör. 20/50, 30/50, 40/50) iki bölüm üst bandı destekliyorsa üst banda yükseltin.</li>
                <li>Proje akışı: Önerilen seviyeye uygun ilk modül dersiyle başlayın.</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                {(() => {
                  const level = (data as any)?.recommendedLevel || (data as any)?.cefrLevel;
                  let path = '/verbfy-lessons';
                  if (level === 'B1') path = '/verbfy-read';
                  if (level === 'B2') path = '/verbfy-grammar';
                  if (level === 'C1') path = '/verbfy-talk';
                  if (level === 'C2') path = '/verbfy-read';
                  return (
                    <Link href={path} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Önerilen Dersi Başlat</Link>
                  );
                })()}
                <Link href="/placement" className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200">Başka Test Seç</Link>
              </div>
            </div>

            <div className="text-right">
              <Link href="/dashboard" className="text-blue-700 hover:underline">Panele dön</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}