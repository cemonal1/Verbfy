import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n';

export default function LevelTestLanding() {
  const { locale } = useI18n();
  useEffect(() => {
    // JSON-LD structured data for SEO
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Free English Level Test (CEFR A1–C2)',
      brand: { '@type': 'Organization', name: 'Verbfy' },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '1500' },
      description: 'Free online English level test aligned to CEFR (A1–C2). Discover your level in minutes and get personalized learning recommendations.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' }
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.text = JSON.stringify(ld);
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{locale==='tr'?'Ücretsiz İngilizce Seviye Testi (CEFR) | Verbfy':'Free English Level Test (CEFR) | Verbfy'}</title>
        <meta name="description" content={locale==='tr'?'Ücretsiz CEFR (A1–C2) İngilizce seviye testi. Hemen çöz, seviyeni öğren, kişiselleştirilmiş öneriler al.':'Free CEFR (A1–C2) English level test. Check your level and get personalized recommendations.'} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="/level-test" />
      </Head>

      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">{locale==='tr'?'Ücretsiz İngilizce Seviye Testi (CEFR A1–C2)':'Free English Level Test (CEFR A1–C2)'}</h1>
              <p className="text-lg text-gray-700 mt-4">{locale==='tr'?'Dakikalar içinde seviyeni keşfet. CEFR uyumlu yerleştirme testleriyle güçlü yönlerini ve geliştirme alanlarını öğren, seviyene uygun modüllerle hemen başla.':'Discover your level in minutes. CEFR-aligned placement tests with clear strengths and improvement guidance — start the right modules instantly.'}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/placement" className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">{locale==='tr'?'Testi Başlat':'Start the Test'}</Link>
                <Link href="/cefr-tests" className="px-6 py-3 rounded-lg bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200">{locale==='tr'?'Tüm Testler':'All Tests'}</Link>
              </div>
              <ul className="mt-6 text-gray-700 list-disc pl-5 space-y-1">
                <li>{locale==='tr'?'CEFR/ALTE uyumlu değerlendirme':'CEFR/ALTE aligned assessment'}</li>
                <li>{locale==='tr'?'Sonuç: seviye bandı + bölüm skorları + öneriler':'Result: level band + section scores + recommendations'}</li>
                <li>{locale==='tr'?'Ücretsiz, çevrimiçi, hemen başla':'Free, online, start now'}</li>
              </ul>
            </div>
            <div className="relative h-64 md:h-80">
              <Image src="/images/cefr-bands.png" alt="CEFR bands" fill className="object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{
              titleTr: 'CEFR ile hizalı', titleEn: 'Aligned with CEFR',
              descTr: 'A1–C2 seviyelerini ayırt eden madde tipleri ve bağlamlar.', descEn: 'Item types and contexts that separate A1–C2 levels.'
            },{
              titleTr: 'Ayrıntılı rapor', titleEn: 'Detailed report',
              descTr: 'Genel skor, bölüm skorları, tie-break notları ve seviye önerileri.', descEn: 'Overall score, section scores, tie-break notes, and level advice.'
            },{
              titleTr: 'Kişiselleştirilmiş başlangıç', titleEn: 'Personalized start',
              descTr: 'Seviyene uygun Verbfy modüllerine doğrudan başlatma.', descEn: 'Jump straight into Verbfy modules at your level.'
            }].map((b, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900">{locale==='tr'?b.titleTr:b.titleEn}</h3>
                <p className="text-gray-700 mt-2">{locale==='tr'?b.descTr:b.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ / SEO copy */}
      <section>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{locale==='tr'?'Sık Sorulan Sorular':'Frequently Asked Questions'}</h2>
          <div className="space-y-4 text-gray-700">
            <details className="bg-white border border-gray-100 rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">{locale==='tr'?'CEFR nedir?':'What is CEFR?'}</summary>
              <p className="mt-2">{locale==='tr'?'CEFR, A1–C2 arasında dil seviyelerini tanımlayan uluslararası standarttır.':'CEFR is the international standard describing language levels from A1 to C2.'}</p>
            </details>
            <details className="bg-white border border-gray-100 rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">{locale==='tr'?'Testler ücretsiz mi?':'Are the tests free?'}</summary>
              <p className="mt-2">{locale==='tr'?'Evet, seviye belirleme testleri tüm ziyaretçilere ücretsizdir.':'Yes, placement tests are free for all visitors.'}</p>
            </details>
            <details className="bg-white border border-gray-100 rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">{locale==='tr'?'Sonuçlarım nasıl yorumlanır?':'How are results interpreted?'}</summary>
              <p className="mt-2">{locale==='tr'?'Sonuç kartında seviye bandınız, bölüm skorlarınız ve seviyeye göre önerilen modüller gösterilir.':'Your result card shows level band, section scores, and recommended modules for your level.'}</p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}


