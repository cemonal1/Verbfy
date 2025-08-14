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
        if (!res) {
          res = await cefrTestsAPI.getTestAttempt(attemptId).catch(() => null);
        }
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

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cefrTestsAPI } from '@/lib/api';
import { TestAttempt } from '@/types/cefrTests';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/common/Toast';

export default function TestResultsPage() {
  const router = useRouter();
  const { attemptId } = router.query;
  const { user } = useAuthContext();
  const { error } = useToast();
  
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attemptId && typeof attemptId === 'string') {
      loadTestResults();
    }
  }, [attemptId]);

  const loadTestResults = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the API
      // const response = await cefrTestsAPI.getTestResults(attemptId);
      // setAttempt(response.attempt);
      
      // For now, we'll simulate the data structure
      setAttempt({
        _id: attemptId as string,
        student: user?._id || '',
        testId: 'test-id',
        resourceType: 'test',
        cefrLevel: 'B1',
        startedAt: new Date().toISOString(),
        timeSpent: 1800, // 30 minutes
        timeLimit: 3600, // 60 minutes
        score: 85,
        maxScore: 100,
        answers: [],
        skills: {
          grammar: 80,
          reading: 90,
          writing: 75,
          speaking: 85,
          listening: 88,
          vocabulary: 82
        },
        feedback: {
          overall: 'Excellent performance! You have demonstrated strong English skills across all areas.',
          strengths: [
            'Strong reading comprehension skills',
            'Good vocabulary usage',
            'Solid grammar foundation'
          ],
          areasForImprovement: [
            'Focus on writing structure and organization',
            'Practice more complex sentence patterns'
          ],
          recommendations: [
            'Take B2 level lessons to advance further',
            'Practice writing essays regularly',
            'Engage in more speaking activities'
          ]
        },
        isCompleted: true,
        isPassed: true
      } as TestAttempt);
    } catch (err) {
      error('Failed to load test results');
      console.error('Error loading test results:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-blue-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['student', 'teacher', 'admin']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!attempt) {
    return (
      <DashboardLayout allowedRoles={['student', 'teacher', 'admin']}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Results not found</h2>
          <button
            onClick={() => router.push('/cefr-tests')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Tests
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['student', 'teacher', 'admin']}>
      <Head>
        <title>Test Results - Verbfy</title>
      </Head>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Results</h1>
              <p className="text-gray-600">
                Your performance analysis and detailed feedback
              </p>
            </div>
            <button
              onClick={() => router.push('/cefr-tests')}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Tests
            </button>
          </div>
        </div>

        {/* Overall Score Card */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBackground(attempt.score)} mb-4`}>
              <span className={`text-3xl font-bold ${getScoreColor(attempt.score)}`}>
                {attempt.score}%
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {attempt.isPassed ? '🎉 Congratulations!' : 'Keep Practicing!'}
            </h2>
            <p className="text-gray-600 mb-4">
              {attempt.isPassed 
                ? `You passed the ${attempt.cefrLevel} level test!` 
                : `You need ${attempt.maxScore - attempt.score} more points to pass.`
              }
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Time Spent</div>
                <div className="text-gray-600">{formatTime(attempt.timeSpent)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">CEFR Level</div>
                <div className="text-gray-600">{attempt.cefrLevel}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Status</div>
                <div className={`font-medium ${attempt.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                  {attempt.isPassed ? 'Passed' : 'Not Passed'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skills Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Skills Breakdown</h3>
            
            <div className="space-y-4">
              {Object.entries(attempt.skills).map(([skill, score]) => (
                <div key={skill} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-4 h-4 mr-3">
                      {skill === 'grammar' && '📝'}
                      {skill === 'reading' && '📖'}
                      {skill === 'writing' && '✍️'}
                      {skill === 'speaking' && '🎤'}
                      {skill === 'listening' && '🎧'}
                      {skill === 'vocabulary' && '📚'}
                    </span>
                    <span className="capitalize font-medium text-gray-900">{skill}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getScoreBackground(score)}`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                    <span className={`font-semibold ${getScoreColor(score)}`}>
                      {score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Detailed Feedback</h3>
            
            <div className="space-y-6">
              {/* Overall Feedback */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Overall Assessment</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {attempt.feedback.overall}
                </p>
              </div>

              {/* Strengths */}
              <div>
                <h4 className="font-medium text-green-700 mb-2 flex items-center">
                  <span className="mr-2">✅</span>
                  Your Strengths
                </h4>
                <ul className="space-y-1">
                  {attempt.feedback.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div>
                <h4 className="font-medium text-orange-700 mb-2 flex items-center">
                  <span className="mr-2">🔧</span>
                  Areas for Improvement
                </h4>
                <ul className="space-y-1">
                  {attempt.feedback.areasForImprovement.map((area, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                  <span className="mr-2">💡</span>
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {attempt.feedback.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/personalized-curriculum')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View My Curriculum
          </button>
          <button
            onClick={() => router.push('/verbfy-lessons')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Practice More Lessons
          </button>
          <button
            onClick={() => router.push('/cefr-tests')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Take Another Test
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
} 