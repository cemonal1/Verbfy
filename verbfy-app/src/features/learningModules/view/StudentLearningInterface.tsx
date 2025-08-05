import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { VerbfyLesson, LessonAttempt } from '@/types/verbfyLessons';
import { verbfyLessonsAPI } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';

interface StudentLearningInterfaceProps {
  lessonId: string;
  onComplete?: (result: any) => void;
}

export const StudentLearningInterface: React.FC<StudentLearningInterfaceProps> = ({
  lessonId,
  onComplete
}) => {
  const router = useRouter();
  const { user } = useAuthContext();
  const [lesson, setLesson] = useState<VerbfyLesson | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: any}>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await verbfyLessonsAPI.getLesson(lessonId);
      setLesson(response);
      
      // Start the lesson
      const startResponse = await verbfyLessonsAPI.startLesson(lessonId);
      setAttemptId(startResponse.attemptId);
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: any) => {
    const key = `${currentExercise}`;
    setAnswers(prev => ({
      ...prev,
      [key]: answer
    }));
  };

  const handleNext = () => {
    if (currentExercise < (lesson?.content.exercises?.length || 0) - 1) {
      setCurrentExercise(currentExercise + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentExercise > 0) {
      setCurrentExercise(currentExercise - 1);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId || !lesson) return;

    try {
      setSubmitting(true);
      
      const formattedAnswers = Object.entries(answers).map(([key, answer]) => ({
        questionIndex: parseInt(key),
        studentAnswer: answer,
        timeSpent: 0
      }));

      const result = await verbfyLessonsAPI.submitLesson(attemptId, {
        answers: formattedAnswers,
        timeSpent
      });

      if (onComplete) {
        onComplete(result);
      } else {
        router.push(`/verbfy-lessons/${lessonId}/results`);
      }
    } catch (error) {
      console.error('Error submitting lesson:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!lesson?.content.exercises) return 0;
    const totalExercises = lesson.content.exercises.length;
    const answeredExercises = Object.keys(answers).length;
    return (answeredExercises / totalExercises) * 100;
  };

  const getLessonTypeIcon = (type: string) => {
    const icons = {
      VerbfyGrammar: '📝',
      VerbfyRead: '📖',
      VerbfyWrite: '✍️',
      VerbfySpeak: '🗣️',
      VerbfyListen: '👂',
      VerbfyVocab: '📚'
    };
    return icons[type as keyof typeof icons] || '📊';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Lesson not found</p>
        </div>
      </div>
    );
  }

  const currentExerciseData = lesson.content.exercises?.[currentExercise];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">{getLessonTypeIcon(lesson.lessonType)}</div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{lesson.title}</h1>
                <p className="text-sm text-gray-500">{lesson.category}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Progress: {getProgress().toFixed(1)}%
              </div>
              <div className="text-sm font-medium text-blue-600">
                ⏱️ {formatTime(timeSpent)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showInstructions ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">{getLessonTypeIcon(lesson.lessonType)}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h2>
              <p className="text-gray-600">{lesson.description}</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700">{lesson.content.instructions}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{lesson.content.exercises?.length || 0}</div>
                  <div className="text-sm text-gray-600">Exercises</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{lesson.estimatedDuration}</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{lesson.content.materials?.length || 0}</div>
                  <div className="text-sm text-gray-600">Materials</div>
                </div>
              </div>

              {lesson.learningObjectives.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Objectives</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {lesson.learningObjectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={() => setShowInstructions(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-md transition-colors"
                >
                  Start Lesson
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md">
            {/* Progress Bar */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Exercise {currentExercise + 1} of {lesson.content.exercises?.length || 0}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(getProgress())}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgress()}%` }}
                ></div>
              </div>
            </div>

            {/* Exercise Content */}
            <div className="p-6">
              {currentExerciseData && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {currentExerciseData.question}
                    </h3>
                    
                    {currentExerciseData.imageUrl && (
                      <img 
                        src={currentExerciseData.imageUrl} 
                        alt="Exercise" 
                        className="max-w-full h-auto rounded-lg mb-4"
                      />
                    )}
                    
                    {currentExerciseData.audioUrl && (
                      <audio controls className="w-full mb-4">
                        <source src={currentExerciseData.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-3">
                    {currentExerciseData.type === 'multiple-choice' && currentExerciseData.options && (
                      <div className="space-y-3">
                        {currentExerciseData.options.map((option, index) => (
                          <label key={index} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name={`exercise-${currentExercise}`}
                              value={option}
                              checked={answers[currentExercise] === option}
                              onChange={(e) => handleAnswer(e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="ml-3 text-gray-900">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {currentExerciseData.type === 'fill-blank' && (
                      <input
                        type="text"
                        value={answers[currentExercise] || ''}
                        onChange={(e) => handleAnswer(e.target.value)}
                        placeholder="Enter your answer..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}

                    {currentExerciseData.type === 'essay' && (
                      <textarea
                        value={answers[currentExercise] || ''}
                        onChange={(e) => handleAnswer(e.target.value)}
                        placeholder="Write your answer..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}

                    {currentExerciseData.type === 'matching' && currentExerciseData.options && (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">Match the items on the left with the correct answers on the right:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentExerciseData.options.map((option, index) => (
                            <div key={index} className="p-3 border border-gray-200 rounded-lg">
                              <label className="flex items-center">
                                <input
                                  type="text"
                                  value={answers[`${currentExercise}-${index}`] || ''}
                                  onChange={(e) => handleAnswer({ ...answers, [`${currentExercise}-${index}`]: e.target.value })}
                                  placeholder={`Match ${index + 1}`}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
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
                  disabled={currentExercise === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex items-center space-x-3">
                  {currentExercise === (lesson.content.exercises?.length || 0) - 1 ? (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Complete Lesson'}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={!answers[currentExercise]}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 