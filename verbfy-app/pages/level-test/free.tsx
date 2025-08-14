import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BrandLogo from '@/components/shared/BrandLogo';
import { useI18n } from '@/lib/i18n';

type Q = {
  question: string;
  options: string[];
  correct: string;
  section: 'grammar'|'vocabulary'|'reading'|'advanced'|'use';
};

type LocalTest = {
  id: string;
  title: string;
  description: string;
  rubric?: { min: number; max: number; level: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2' }[];
  rubricMode?: 'ratio50' | 'ratio60' | 'kidsA1B1';
  items: Q[];
};

const makeMC = (question: string, options: string[], correct: string, section: Q['section']): Q => ({ question, options, correct, section });

// 1) Global CEFR Placement (50Q) – condensed but representative
const global50: LocalTest = {
  id: 'global-50',
  title: 'Global CEFR Placement (50Q)',
  description: 'A1–C2 arası karışık 50 soruluk yerleştirme (grammar, vocabulary, reading, advanced).',
  rubricMode: 'ratio50',
  items: [
    // Grammar & Use (sample from earlier seed)
    makeMC('I usually ______ coffee before work.', ['drink','drank','am drink','drinks'], 'drink', 'grammar'),
    makeMC('Where ______ from?', ['you are','are you','do you are','you from are'], 'are you', 'grammar'),
    makeMC('She can’t come today because she ______ a cold.', ['have','has','is having','had'], 'has', 'grammar'),
    makeMC('We ______ to the cinema last night.', ['go','goes','went','going'], 'went', 'grammar'),
    makeMC('Is there ______ milk in the fridge?', ['some','any','a','many'], 'any', 'grammar'),
    makeMC('This book is ______ than that one.', ['more cheap','cheapier','cheaper','the cheapest than'], 'cheaper', 'grammar'),
    makeMC('If it ______ tomorrow, we’ll stay at home.', ['rains','rained','will rain','is raining'], 'rains', 'grammar'),
    makeMC('I’ve lived in Ankara ______ 2019.', ['since','for','from','by'], 'since', 'grammar'),
    makeMC('He ______ to the gym when I called him.', ['goes','was going','has gone','had gone'], 'was going', 'grammar'),
    makeMC('We ______ already ______ dinner when she arrived.', ['have / finished','had / finished','were / finishing','finish / already'], 'had / finished', 'grammar'),
    makeMC('The meeting was cancelled, ______ was disappointing.', ['what','which','that','it'], 'which', 'grammar'),
    makeMC('She’s the person ______ helped me with my project.', ['which','who','what','whose'], 'who', 'grammar'),
    makeMC('I wish I ______ more time to travel.', ['have','had','will have','would have'], 'had', 'grammar'),
    makeMC('By this time next year, they ______ their new product.', ['launch','will launch','will have launched','are launching'], 'will have launched', 'grammar'),
    makeMC('Not only ______ the report on time, but he also presented it clearly.', ['did he submit','he submitted','submitted he','he did submit'], 'did he submit', 'advanced'),
    makeMC('If I ______ you, I’d renegotiate the contract.', ['am','were','had been','would be'], 'were', 'advanced'),
    makeMC('Hardly ______ sitting down when the phone rang.', ['I was','had I','I had','was I'], 'had I', 'advanced'),
    makeMC('The proposal, ______ several experts objected to, passed narrowly.', ['whose','which','to which','that'], 'to which', 'advanced'),
    makeMC('He denied ______ the confidential files.', ['to access','accessing','having accessed','to have accessed'], 'having accessed', 'advanced'),
    makeMC('It’s high time we ______ a more sustainable strategy.', ['adopt','adopted','will adopt','had adopted'], 'adopted', 'advanced'),
    // Vocabulary
    makeMC('The company’s profits have ______ significantly this quarter.', ['risen','raised','aroused','lifted'], 'risen', 'vocabulary'),
    makeMC('She has a natural ______ for languages.', ['aptitude','attitude','altitude','latitude'], 'aptitude', 'vocabulary'),
    makeMC('We need to ______ a balance between cost and quality.', ['strike','punch','beat','hit out'], 'strike', 'vocabulary'),
    makeMC('The software is fully ______ with older devices.', ['competitive','compatible','comparable','compel'], 'compatible', 'vocabulary'),
    makeMC('Due to time constraints, we’ll have to ______ the meeting.', ['prolong','call off','draw up','look into'], 'call off', 'vocabulary'),
    makeMC('His explanation was so ______ that nobody had questions.', ['ambiguous','comprehensive','tentative','redundant'], 'comprehensive', 'vocabulary'),
    makeMC('The CEO praised her for her ______ to the project.', ['devotion','diversion','derision','detraction'], 'devotion', 'vocabulary'),
    makeMC('The film offers a ______ portrayal of adolescence.', ['nuanced','noisy','null','narrow'], 'nuanced', 'vocabulary'),
    makeMC('They launched an ______ campaign to raise awareness.', ['outspoken','outrageous','outreach','outlandish'], 'outreach', 'vocabulary'),
    makeMC('The scientist’s findings were later ______ by independent labs.', ['vindicated','validated','violated','vacated'], 'validated', 'vocabulary'),
    // Reading (short)
    makeMC('Cities are introducing cooling centres for heatwaves. What measure are cities taking?', ['Building pools','Introducing cooling centres','Removing AC','Lowering buildings'], 'Introducing cooling centres', 'reading'),
    makeMC('Scientists warn heatwaves will ______ without reducing emissions.', ['decrease','worsen','disappear','stabilize'], 'worsen', 'reading'),
    makeMC('Overall message: global warming requires ______', ['no steps','steps to prevent worse heatwaves','lower buildings','more AC'], 'steps to prevent worse heatwaves', 'reading'),
    makeMC('Remote work impact on productivity ______', ['always increases','is universally disliked','differs among individuals','requires office'], 'differs among individuals', 'reading'),
    // Advanced/Cohesion
    makeMC('Choose the sentence with correct grammar:', ['Rarely we have seen such results.','Rarely have we seen such results.','Rarely did we have saw such results.','Rarely we had seen such results.'], 'Rarely have we seen such results.', 'advanced'),
    makeMC('“Her argument was compelling, ______ it rested on a questionable premise.”',['although','so that','unless','despite'],'although','advanced'),
    makeMC('Most formal phrasing',['The data kind of shows a drop.','The data shows a drop, like, big time.','The data indicates a notable decline.','The data is super down.'],'The data indicates a notable decline.','advanced'),
    makeMC('Best modality/stance',['mustn’t be right; number exactly matches','has to be the right address; the number matches','shouldn’t be right; we are here','can’t be right; the number matches'],'has to be the right address; the number matches','advanced'),
    makeMC('Cohesion linker: “Many advocate earlier language instruction; ______, evidence is mixed.”',['moreover','however','therefore','for example'],'however','advanced'),
    makeMC('Correct relative punctuation',['policy which was launched in May has, increased','policy—launched in May—has increased','policy launched in May, has increased','policy, which launched in May increased, retention'],'policy—launched in May—has increased','advanced'),
    makeMC('By the time the audit began, they ______ key controls for months.',['were ignoring','had been ignoring','have ignored','would ignore'],'had been ignoring','advanced'),
    makeMC('The two reports are broadly ______ with one another.',['consecutive','conducive','consistent','constitutive'],'consistent','vocabulary'),
    makeMC('Inversion: Under no circumstances ______ disclose the data.',['you may','may you','you disclose','may disclose you'],'may you','advanced'),
    makeMC('Idiomatic collocation: “The committee will ______ the proposal next week.”',['observe','oversee','deliberate on','contemplate about'],'deliberate on','advanced'),
  ],
};

// 2) Kids Placement (A1–B1) – shortened representative set
const kidsA1B1: LocalTest = {
  id: 'kids-a1-b1',
  title: 'Kids Placement (A1–B1)',
  description: '6–14 yaş için temel dilbilgisi, kelime ve kısa okuma maddeleri.',
  rubricMode: 'kidsA1B1',
  items: [
    makeMC('How old ___ you?', ['are','is','am','be'], 'are', 'grammar'),
    makeMC('She ___ tennis every Sunday.', ['play','plays','playing','played'], 'plays', 'grammar'),
    makeMC('___ the children playing?', ['Is','Are','Do','Does'], 'Are', 'grammar'),
    makeMC('There ___ a cat under the table.', ['is','are','have','has'], 'is', 'grammar'),
    makeMC('I have two ___.', ['cat','cats','cat’s','cates'], 'cats', 'grammar'),
    makeMC('They ___ going to the park now.', ['is','am','are','be'], 'are', 'grammar'),
    makeMC('This book belongs ___ Sarah.', ['on','to','with','at'], 'to', 'grammar'),
    makeMC('Tom ___ football in the afternoon.', ['playing','plays','is playing','play'], 'plays', 'grammar'),
    makeMC('We ___ breakfast at 8 o’clock.', ['have','has','having','haves'], 'have', 'grammar'),
    makeMC('My sister ___ a pen.', ['have','has','is having','have got'], 'has', 'grammar'),
    makeMC('Opposite of “hot”?', ['cold','warm','rainy','summer'], 'cold', 'vocabulary'),
    makeMC('Which word names a fruit?', ['car','apple','chair','cat'], 'apple', 'vocabulary'),
    makeMC('How many days are in a week?', ['5','6','7','8'], '7', 'vocabulary'),
    makeMC('Which of these animals can fly?', ['Elephant','Sparrow','Dog','Horse'], 'Sparrow', 'vocabulary'),
    makeMC('Color of grass?', ['Red','Yellow','Green','Blue'], 'Green', 'vocabulary'),
    makeMC('Which one is a vegetable?', ['Banana','Carrot','Apple','Strawberry'], 'Carrot', 'vocabulary'),
    makeMC('For breakfast, we usually eat ___.', ['apple','book','car','pencil'], 'apple', 'vocabulary'),
    makeMC('Item not found in a school?', ['Desk','Board','Refrigerator','Chair'], 'Refrigerator', 'vocabulary'),
    makeMC('Mode of transportation?', ['Car','Chair','House','Pencil'], 'Car', 'vocabulary'),
    makeMC('“Merhaba” in English?', ['Good morning','Hello','Goodbye','Please'], 'Hello', 'vocabulary'),
    // Reading short facts
    makeMC('Read: John has a red car. Q: What color?', ['Red','Blue','Green','Yellow'], 'Red', 'reading'),
    makeMC('Read: Emma eats an apple and a banana. Q: What?', ['Apple','Bananas','Apple and banana','Orange'], 'Apple and banana', 'reading'),
    makeMC('Read: Mike is in the garden. Q: Where?', ['House','Garden','School','Market'], 'Garden', 'reading'),
    makeMC('Tom has 4 sisters and 2 brothers. How many siblings?', ['2','4','6','8'], '6', 'reading'),
    makeMC('Family picnic every Sunday. How often?', ['Every day','Every Sunday','Every month','Never'], 'Every Sunday', 'reading'),
  ],
};

// 3) Adults A1–B2 – representative set with rubric (60 style mapping)
const adultsA1B2: LocalTest = {
  id: 'adults-a1-b2',
  title: 'Adults Placement (A1–B2)',
  description: 'Yetişkinler için A1–B2 yerleştirme: günlük dil, grammar ve kısa okuma.',
  rubricMode: 'ratio60',
  items: [
    makeMC('I usually ___ coffee in the morning.', ['drink','drinks','am drinking','drank'], 'drink', 'grammar'),
    makeMC('She ___ to the gym every day.', ['go','goes','going','gone'], 'goes', 'grammar'),
    makeMC('They ___ in France last year.', ['were','was','are','have been'], 'were', 'grammar'),
    makeMC('I ___ my homework before I watched TV.', ['finished','had finished','have finished','finishes'], 'had finished', 'grammar'),
    makeMC('By the end of this month, I ___ here for a year.', ['will work','worked','will have worked','have worked'], 'will have worked', 'grammar'),
    makeMC('If I ___ more money, I would travel.', ['will have','had','had had','have'], 'had', 'grammar'),
    makeMC('She asked me where ___ from.', ['I was','I were','was I','am I'], 'I was', 'grammar'),
    makeMC('Neither the manager ___ the staff were available.', ['nor','or','and','but'], 'nor', 'grammar'),
    makeMC('It’s high ___ we started.', ['time','noon','evening','hour'], 'time', 'grammar'),
    makeMC('This is a ___ day; let’s go for a walk.', ['sunny','rain','hot','swimming'], 'sunny', 'vocabulary'),
    makeMC('He was ___ by the size of the crowd.', ['surprising','surprised','surprise','surprise'], 'surprised', 'vocabulary'),
    makeMC('They solved the problem, ___ difficulties.', ['inspite','despite','although','though'], 'despite', 'vocabulary'),
    makeMC('We need to ___ the decision carefully.', ['take','make','do','make up'], 'make', 'vocabulary'),
    makeMC('Her English is ___ better than mine.', ['much','many','more','so'], 'much', 'vocabulary'),
    makeMC('Read: Jane gave Tom a book. Q: What did Jane give?', ['A toy','A car','A book','Money'], 'A book', 'reading'),
    makeMC('Read: They have lived in Rome ___ ten years.', ['since','for','during','from'], 'for', 'reading'),
    makeMC('Read: The meeting ___ at 3 PM tomorrow.', ['is','starts','will start','start'], 'will start', 'reading'),
    makeMC('No sooner had he arrived ___ he got a phone call.', ['when','than','that','as soon as'], 'than', 'advanced'),
    makeMC('I suggest that he ___ to the doctor.', ['goes','go','will go','went'], 'go', 'advanced'),
    makeMC('It’s essential ___ aware of your surroundings.', ['to','be','being','that be'], 'to', 'advanced'),
  ],
};

// 4) Advanced B1–C2 – representative set
const advancedB1C2: LocalTest = {
  id: 'advanced-b1-c2',
  title: 'Advanced Placement (B1–C2)',
  description: 'İleri seviye grammar, vocabulary, reading, paraphrase ve cohesion.',
  rubricMode: 'ratio60',
  items: [
    makeMC('If she _______ harder, she would have passed the exam.', ['had studied','has studied','studied','will study'], 'had studied', 'advanced'),
    makeMC('The report ________ be completed by next Monday.', ['should','must','may','can'], 'should', 'grammar'),
    makeMC('Not only __________ the task in time, but we also improved the result.', ['we finished','did we finish','we did finish','we had finished'], 'did we finish', 'advanced'),
    makeMC('The new app is _________ to thousands of users every week.', ['download','downloading','downloaded','to download'], 'downloaded', 'grammar'),
    makeMC('Select the word closest in meaning to "obtain".', ['lose','acquire','omit','deprive'], 'acquire', 'vocabulary'),
    makeMC('We need to put a _______ on the spending.', ['cap','top','boundary','loop'], 'cap', 'vocabulary'),
    makeMC('“Gave up” means:', ['started','stopped','reduced','postponed'], 'stopped', 'vocabulary'),
    makeMC('He is fully _____ favour of the proposal.', ['in','on','for','to'], 'in', 'use'),
    makeMC('They haven\'t _____ their tickets yet.', ['booked','buying','buy','had bought'], 'booked', 'use'),
    makeMC('I wish I ________ the chance to travel when I was younger.', ['had','have had','have','had had'], 'had had', 'advanced'),
    makeMC('We have ________ all possibilities but still cannot solve this issue.', ['exhausted','implemented','expanded','established'], 'exhausted', 'vocabulary'),
    makeMC('Paraphrase: “She regretted not attending the meeting.”', ['She was sorry she hadn’t gone.','She wanted to skip the meeting.','She was happy she didn’t go.','She couldn’t find the meeting.'], 'She was sorry she hadn’t gone.', 'advanced'),
    makeMC('Paraphrase: “Despite the rain, the match continued.”', ['started because it rained','continued even though it was raining','ended due to rain','was canceled'], 'continued even though it was raining', 'advanced'),
    makeMC('Paraphrase: “No sooner had I sat down than the phone rang.”', ['after phone rang','then phone rang immediately','before I sat','I sat down late'], 'then phone rang immediately', 'advanced'),
  ],
};

const TESTS: LocalTest[] = [global50, kidsA1B1, adultsA1B2, advancedB1C2];

export default function FreeLevelTests() {
  const { locale, setLocale } = useI18n();
  const [selectedId, setSelectedId] = useState<string>('global-50');
  const [answers, setAnswers] = useState<Record<number,string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const test = useMemo(() => TESTS.find(t => t.id === selectedId)!, [selectedId]);

  const correctCount = useMemo(() => {
    return Object.entries(answers).reduce((acc, [idxStr, val]) => {
      const idx = Number(idxStr);
      return acc + (test.items[idx]?.correct === val ? 1 : 0);
    }, 0);
  }, [answers, test]);

  const recommended = useMemo(() => {
    const c = correctCount;
    if (test.rubricMode === 'ratio50') {
      // 50 maddelik sınav kesimleri: 0–10 A1, 11–20 A2, 21–30 B1, 31–40 B2, 41–46 C1, 47–50 C2
      if (c <= 10) return 'A1';
      if (c <= 20) return 'A2';
      if (c <= 30) return 'B1';
      if (c <= 40) return 'B2';
      if (c <= 46) return 'C1';
      return 'C2';
    }
    if (test.rubricMode === 'ratio60') {
      // 60 maddelik sınav kesimleri: 0–29 B1, 30–44 B2, 45–55 C1, 56–60 C2
      if (c <= 29) return 'B1';
      if (c <= 44) return 'B2';
      if (c <= 55) return 'C1';
      return 'C2';
    }
    if (test.rubricMode === 'kidsA1B1') {
      if (c <= 10) return 'A1';
      if (c <= 20) return 'A2';
      return 'B1';
    }
    // default fallback if rubric provided explicitly
    const match = test.rubric?.find(r => c >= r.min && c <= r.max);
    return match ? match.level : 'B1';
  }, [correctCount, test]);

  const sectionBreakdown = useMemo(() => {
    const totals: Record<string, { correct: number; total: number }> = {};
    test.items.forEach((q, idx) => {
      const key = q.section;
      if (!totals[key]) totals[key] = { correct: 0, total: 0 };
      totals[key].total += 1;
      if (answers[idx] && answers[idx] === q.correct) totals[key].correct += 1;
    });
    return totals;
  }, [answers, test]);

  const recommendationsList = useMemo(() => {
    const list: string[] = [];
    if (recommended === 'B1') list.push('Temel dil bilgisi yapılarını (zamanlar, soru/olumsuz, edatlar) pekiştirin.');
    if (recommended === 'B2') list.push('Bağlaçlar, edilgen yapı ve görece/koşul cümleleri üzerinde çalışın.');
    if (recommended === 'C1') list.push('İnversion, cleft, gelişmiş bağlaşıklık ve paraphrase pratikleri yapın.');
    if (recommended === 'C2') list.push('Akademik metinlere odaklanın; nüans ve deyimsel kullanımları artırın.');
    // Section‑based hints
    if (sectionBreakdown.reading && sectionBreakdown.reading.correct < sectionBreakdown.reading.total * 0.6) list.push('Okuma: Ana fikir, detay ve çıkarım sorularında hız/doğruluk çalışın.');
    if (sectionBreakdown.grammar && sectionBreakdown.grammar.correct < sectionBreakdown.grammar.total * 0.6) list.push('Dil Bilgisi: Karışık zamanlar ve cümle içi doğruluk için kısa alıştırmalar.');
    if (sectionBreakdown.vocabulary && sectionBreakdown.vocabulary.correct < sectionBreakdown.vocabulary.total * 0.6) list.push('Kelime: Tematik kelime listeleri ve collocation pratikleri.');
    if (sectionBreakdown.advanced && sectionBreakdown.advanced.correct < (sectionBreakdown.advanced.total || 1) * 0.6) list.push('İleri Yapılar: bağlaşıklık, resmî üslup ve dönüşümlerde alıştırmalar.');
    return list;
  }, [recommended, sectionBreakdown]);

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Ücretsiz CEFR Seviye Testleri (Frontend) | Verbfy</title>
        <meta name="description" content="Backend bağımsız ücretsiz CEFR seviye testleri. Global, Çocuklar, Yetişkinler ve İleri düzey testler."></meta>
      </Head>

      {/* Nav Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <BrandLogo size={44} />
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900">{locale==='tr'?'Ana Sayfa':'Home'}</Link>
              <Link href="/free-materials" className="text-gray-600 hover:text-gray-900">{locale==='tr'?'Ücretsiz Materyaller':'Free Materials'}</Link>
              <Link href="/verbfy-talk" className="text-gray-600 hover:text-gray-900">VerbfyTalk</Link>
              <Link href="/teachers" className="text-gray-600 hover:text-gray-900">{locale==='tr'?'Öğretmenler':'Teachers'}</Link>
              <Link href="/level-test/free" className="text-blue-600 font-semibold">{locale==='tr'?'Seviye Testi':'Level Test'}</Link>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setLocale(locale==='tr'?'en':'tr')}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                aria-label="Language toggle"
              >{locale==='tr'?'EN':'TR'}</button>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">{locale==='tr'?'Giriş':'Log in'}</Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{locale==='tr'?'Kayıt Ol':'Register'}</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{locale==='tr'?'Ücretsiz CEFR Seviye Testi':'Free CEFR Level Test'}</h1>
          <p className="text-blue-100 mt-2">
            {locale==='tr'
              ? 'Sana uygun seviye testini çöz; sonucuna göre önerilen derslerle İngilizceni geliştir, eksiklerini tamamla.'
              : 'Take the level test that fits you; follow the recommended lessons to improve your English and close gaps.'}
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">{locale==='tr'?'Test Seçimi':'Choose a Test'}</h2>
          <p className="text-gray-700 mt-1">{locale==='tr'?'Başlamak için bir test seç ve "Testi Başlat" butonuna tıkla. Seçmeden sorular gösterilmez.':'Select a test and click "Start Test". Questions appear only after starting.'}</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTS.map(t => (
              <button key={t.id} onClick={() => { setSelectedId(t.id); setAnswers({}); setSubmitted(false); setHasStarted(false); }}
                className={`border rounded-xl p-4 text-left hover:shadow transition ${selectedId===t.id?'border-blue-500 ring-1 ring-blue-200':'border-gray-200'}`}>
                <div className="font-semibold text-gray-900">{t.title}</div>
                <div className="text-sm text-gray-600 mt-1 line-clamp-3">{t.description}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => { setAnswers({}); setSubmitted(false); setHasStarted(true); }} className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">{locale==='tr'?'Testi Başlat':'Start Test'}</button>
          </div>
        </div>

        {/* Questions */}
        {hasStarted && (
        <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-700">Soru Sayısı: <strong>{test.items.length}</strong></div>
            <div className="text-gray-700">İşaretlenen: <strong>{Object.keys(answers).length}</strong></div>
          </div>

          <ol className="space-y-5">
            {test.items.map((q, idx) => (
              <li key={idx} className="border-b last:border-0 pb-4">
                <div className="font-medium text-gray-900 mb-2">{idx+1}. {q.question}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, i) => (
                    <label key={i} className={`flex items-center p-3 rounded-lg border cursor-pointer ${answers[idx]===opt?'border-blue-500 bg-blue-50':'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name={`q-${idx}`} className="mr-3" value={opt}
                        checked={answers[idx]===opt}
                        onChange={() => setAnswers(prev => ({ ...prev, [idx]: opt }))}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => { setSubmitted(true); }} className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">{locale==='tr'?'Testi Bitir ve Sonucu Gör':'Finish and See Result'}</button>
            <Link href="/level-test" className="text-gray-600 hover:text-gray-900">{locale==='tr'?'Seviye Testi Ana Sayfası':'Level Test Home'}</Link>
          </div>
        </div>
        )}

        {/* Result */}
        {submitted && (
          <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900">{locale==='tr'?'Sonuç':'Result'}</h2>
            <p className="text-gray-700 mt-2">{locale==='tr'?'Doğru sayısı':'Correct'}: <strong>{correctCount}</strong> / {test.items.length}</p>
            <p className="text-gray-700 mt-1">{locale==='tr'?'Önerilen CEFR':'Recommended CEFR'}: <strong className="text-blue-700">{recommended}</strong></p>

            {/* Section breakdown */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(sectionBreakdown).map(([sec, v]) => (
                <div key={sec} className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-center">
                  <div className="text-xs uppercase tracking-wide text-gray-500">{sec}</div>
                  <div className="text-lg font-semibold text-gray-900">{v.correct}/{v.total}</div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-gray-900">{locale==='tr'?'Öneriler':'Recommendations'}</h3>
              <ul className="list-disc pl-5 text-gray-700 mt-1 space-y-1">
                {recommendationsList.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={typeof window!=='undefined' && localStorage.getItem('verbfy_token') ? (recommended==='B1'?'/verbfy-read':recommended==='B2'?'/verbfy-grammar':recommended==='C1'?'/verbfy-talk':'/verbfy-read') : '/register'}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">{locale==='tr'?'Önerilen Dersi Başlat':'Start Suggested Lesson'}</Link>
              <button onClick={() => { setAnswers({}); setSubmitted(false); setHasStarted(false); }} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-900">{locale==='tr'?'Test Seçim Ekranına Dön':'Back to Test Selection'}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


