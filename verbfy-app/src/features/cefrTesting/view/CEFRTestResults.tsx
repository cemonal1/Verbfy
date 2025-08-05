import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { TestAttempt, CEFRTest } from '@/types/cefrTests';
import { cefrTestsAPI } from '@/lib/api';

interface CEFRTestResultsProps {
  attemptId: string;
  onRetake?: () => void;
}

export const CEFRTestResults: React.FC<CEFRTestResultsProps> = ({
  attemptId,
  onRetake
}) => {
  const router = useRouter();
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [test, setTest] = useState<CEFRTest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attemptId) {
      fetchResults();
    }
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const [attemptResponse, testResponse] = await Promise.all([
        cefrTestsAPI.getTestAttempt(attemptId),
        cefrTestsAPI.getTest(attemptId.split('-')[0]) // Assuming attemptId format: testId-attemptId
      ]);
      setAttempt(attemptResponse);
      setTest(testResponse);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLevelColor = (level: string) => {
    const colors = {
      A1: 'bg-red-100 text-red-800',
      A2: 'bg-orange-100 text-orange-800',
      B1: 'bg-yellow-100 text-yellow-800',
      B2: 'bg-green-100 text-green-800',
      C1: 'bg-blue-100 text-blue-800',
      C2: 'bg-purple-100 text-purple-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSkillIcon = (skill: string) => {
    const icons = {
      grammar: '📝',
      reading: '📖',
      writing: '✍️',
      speaking: '🗣️',
      listening: '👂',
      vocabulary: '📚'
    };
    return icons[skill as keyof typeof icons] || '📊';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!attempt || !test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Results not found</p>
        </div>
      </div>
    );
  }

  const scorePercentage = (attempt.score / attempt.maxScore) * 100;
  const isPassed = attempt.isPassed;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Results</h1>
            <p className="text-gray-600 mb-4">{test.title}</p>
            
            <div className="flex items-center justify-center space-x-4 mb-6">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getLevelColor(test.cefrLevel)}`}>
                {test.cefrLevel}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(attempt.completedAt || '').toLocaleDateString()}
              </span>
            </div>

            {/* Overall Score */}
            <div className="mb-6">
              <div className="text-6xl font-bold mb-2">
                <span className={getScoreColor(scorePercentage)}>
                  {scorePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="text-2xl font-semibold text-gray-700 mb-2">
                {attempt.score} / {attempt.maxScore} points
              </div>
              <div className={`text-lg font-medium ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                {isPassed ? '✅ Passed' : '❌ Not Passed'}
              </div>
            </div>

            {/* Time and Progress */}
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Time Spent:</span> {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
              </div>
              <div>
                <span className="font-medium">Questions Answered:</span> {attempt.answers.length}
              </div>
            </div>
          </div>
        </div>

        {/* Skill Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Skill Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(attempt.skills).map(([skill, score]) => (
              <div key={skill} className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">{getSkillIcon(skill)}</div>
                <div className="font-medium text-gray-900 capitalize">{skill}</div>
                <div className={`text-lg font-bold ${getScoreColor(score)}`}>
                  {score}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Feedback</h2>
          
          <div className="space-y-6">
            {/* Overall Feedback */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Overall Assessment</h3>
              <p className="text-gray-700">{attempt.feedback.overall}</p>
            </div>

            {/* Strengths */}
            <div>
              <h3 className="text-lg font-medium text-green-700 mb-2">✅ Your Strengths</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {attempt.feedback.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div>
              <h3 className="text-lg font-medium text-orange-700 mb-2">🔧 Areas for Improvement</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {attempt.feedback.areasForImprovement.map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-lg font-medium text-blue-700 mb-2">💡 Recommendations</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {attempt.feedback.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Question Review</h2>
          <div className="space-y-4">
            {attempt.answers.map((answer, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-gray-900">Question {index + 1}</span>
                  <span className={`text-sm font-medium ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {answer.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{answer.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Your Answer:</span>
                    <p className="text-gray-900">{Array.isArray(answer.studentAnswer) ? answer.studentAnswer.join(', ') : answer.studentAnswer}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Correct Answer:</span>
                    <p className="text-gray-900">{Array.isArray(answer.correctAnswer) ? answer.correctAnswer.join(', ') : answer.correctAnswer}</p>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Points: {answer.points} / {answer.maxPoints}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/cefr-tests')}
              className="px-6 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              Browse More Tests
            </button>
            
            {onRetake && (
              <button
                onClick={onRetake}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Retake Test
              </button>
            )}
            
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 