import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CEFRTest, TestAttempt } from '@/types/cefrTests';
import { cefrTestsAPI } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';

interface CEFRTestInterfaceProps {
  testId: string;
  onComplete?: (result: any) => void;
}

export const CEFRTestInterface: React.FC<CEFRTestInterfaceProps> = ({
  testId,
  onComplete
}) => {
  const router = useRouter();
  const { user } = useAuthContext();
  const [test, setTest] = useState<CEFRTest | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: any}>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timed, setTimed] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => {
    if (testId) {
      fetchTest();
    }
  }, [testId]);

  useEffect(() => {
    if (!timed) return;
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && test) {
      handleSubmit();
    }
  }, [timeRemaining, test, timed]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const response = await cefrTestsAPI.getTest(testId);
      setTest(response);
      
      // Start the test
      const startResponse = await cefrTestsAPI.startTest(testId);
      setAttemptId(startResponse.attemptId);
      setTimed(!!startResponse.test.timed);
      if (startResponse.test.timed) {
        setTimeRemaining(startResponse.test.totalTime * 60); // Convert to seconds
      }
    } catch (error) {
      console.error('Error fetching test:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: any) => {
    const key = `${currentSection}-${currentQuestion}`;
    setAnswers(prev => ({
      ...prev,
      [key]: answer
    }));
  };

  const handleNext = () => {
    const currentSectionData = test?.sections[currentSection];
    if (!currentSectionData) return;

    if (currentQuestion < currentSectionData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentSection < test.sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      const prevSection = test?.sections[currentSection - 1];
      setCurrentQuestion(prevSection ? prevSection.questions.length - 1 : 0);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId || !test) return;

    try {
      setSubmitting(true);
      
      // Convert answers to the expected format
      const formattedAnswers = Object.entries(answers).map(([key, answer]) => {
        const [sectionIndex, questionIndex] = key.split('-').map(Number);
        return {
          sectionIndex,
          questionIndex,
          studentAnswer: answer,
          timeSpent: 0 // You could track this more precisely
        };
      });

      const result = await cefrTestsAPI.submitTest(attemptId, {
        answers: formattedAnswers,
        timeSpent: (test.totalTime * 60) - timeRemaining
      });

      if (onComplete) {
        onComplete(result);
      } else {
        try {
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(`cefr_result_${attemptId}` as string, JSON.stringify(result));
          }
        } catch {}
        router.push(`/cefr-tests/results/${attemptId}`);
      }
    } catch (error) {
      console.error('Error submitting test:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!test) return 0;
    const totalQuestions = test.sections.reduce((sum, section) => sum + section.questions.length, 0);
    const answeredQuestions = Object.keys(answers).length;
    return (answeredQuestions / totalQuestions) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Test not found</p>
        </div>
      </div>
    );
  }

  const currentSectionData = test.sections[currentSection];
  const currentQuestionData = currentSectionData?.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">{test.title}</h1>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                {test.cefrLevel}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Progress: {getProgress().toFixed(1)}%
              </div>
              {timed && (
                <div className="text-sm font-medium text-red-600">
                  ⏱️ {formatTime(timeRemaining)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {test.description && (
          <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-lg px-4 py-3 mb-6 text-sm">
            {test.description}
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md">
          {/* Progress Bar */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Section {currentSection + 1} of {test.sections.length}: {currentSectionData?.name}
              </span>
              <span className="text-sm text-gray-500">
                Question {currentQuestion + 1} of {currentSectionData?.questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentSection * 100) / test.sections.length) + ((currentQuestion * 100) / (test.sections.length * currentSectionData?.questions.length))}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="p-6">
            {currentQuestionData && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {currentQuestionData.question}
                  </h3>
                  
                  {currentQuestionData.imageUrl && (
                    <img 
                      src={currentQuestionData.imageUrl} 
                      alt="Question" 
                      className="max-w-full h-auto rounded-lg mb-4"
                    />
                  )}
                  
                  {currentQuestionData.audioUrl && (
                    <audio controls className="w-full mb-4">
                      <source src={currentQuestionData.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestionData.type === 'multiple-choice' && currentQuestionData.options && (
                    <div className="space-y-3">
                      {currentQuestionData.options.map((option, index) => (
                        <label key={index} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${currentSection}-${currentQuestion}`}
                            value={option}
                            checked={answers[`${currentSection}-${currentQuestion}`] === option}
                            onChange={(e) => handleAnswer(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-3 text-gray-900">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestionData.type === 'fill-blank' && (
                    <input
                      type="text"
                      value={answers[`${currentSection}-${currentQuestion}`] || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                      placeholder="Enter your answer..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {currentQuestionData.type === 'essay' && (
                    <textarea
                      value={answers[`${currentSection}-${currentQuestion}`] || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                      placeholder="Write your answer..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentSection === 0 && currentQuestion === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Test'}
                </button>

                {currentSection < test.sections.length - 1 || currentQuestion < currentSectionData?.questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 