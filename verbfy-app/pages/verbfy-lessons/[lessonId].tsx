import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { verbfyLessonsAPI } from '@/lib/api';
import { VerbfyLesson, LessonAttempt } from '@/types/verbfyLessons';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/common/Toast';

export default function LessonTakingPage() {
  const router = useRouter();
  const { lessonId } = router.query;
  const { user } = useAuthContext();
  const { success, error } = useToast();
  
  const [lesson, setLesson] = useState<VerbfyLesson | null>(null);
  const [attempt, setAttempt] = useState<LessonAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  useEffect(() => {
    if (lessonId && typeof lessonId === 'string') {
      loadLesson();
    }
  }, [lessonId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const lessonResponse = await verbfyLessonsAPI.getLesson(lessonId as string);
      setLesson(lessonResponse.lesson);
      
      // Start lesson attempt
      const attemptResponse = await verbfyLessonsAPI.startLesson(lessonId as string);
      setAttempt(attemptResponse.attempt);
    } catch (err) {
      error('Failed to load lesson');
      console.error('Error loading lesson:', err);
      router.push('/verbfy-lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (exerciseIndex: string | number, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [exerciseIndex]: answer
    }));
  };

  const handleNextStep = () => {
    if (currentStep < lesson!.content.exercises.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!attempt) return;
    
    setIsSubmitting(true);
    try {
      const response = await verbfyLessonsAPI.submitLesson(attempt._id, {
        answers,
        timeSpent
      });
      
      success('Lesson completed successfully!');
      router.push(`/verbfy-lessons/${lessonId}/results`);
    } catch (err) {
      error('Failed to submit lesson');
      console.error('Error submitting lesson:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!lesson) return 0;
    return ((currentStep + 1) / lesson.content.exercises.length) * 100;
  };

  const getLessonTypeIcon = (lessonType: string) => {
    const icons = {
      'VerbfyGrammar': '📝',
      'VerbfyRead': '📖',
      'VerbfyWrite': '✍️',
      'VerbfySpeak': '🎤',
      'VerbfyListen': '🎧',
      'VerbfyVocab': '📚'
    };
    return icons[lessonType as keyof typeof icons] || '📚';
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

  if (!lesson || !attempt) {
    return (
      <DashboardLayout allowedRoles={['student', 'teacher', 'admin']}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lesson not found</h2>
          <button
            onClick={() => router.push('/verbfy-lessons')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Lessons
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const currentExercise = lesson.content.exercises[currentStep];

  return (
    <DashboardLayout allowedRoles={['student', 'teacher', 'admin']}>
      <Head>
        <title>{lesson.title} - Verbfy</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header with Progress */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{lesson.title}</h1>
                <p className="text-sm text-gray-600">
                  {getLessonTypeIcon(lesson.lessonType)} {lesson.lessonType} • 
                  {lesson.cefrLevel} • {lesson.difficulty} • 
                  Step {currentStep + 1} of {lesson.content.exercises.length}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Time: {formatTime(timeSpent)}
                </div>
                
                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Complete Lesson
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                {/* Lesson Instructions */}
                {currentStep === 0 && (
                  <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Lesson Instructions</h3>
                    <div className="prose prose-sm text-gray-700">
                      <p>{lesson.content.instructions}</p>
                    </div>
                    
                    {lesson.learningObjectives.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Learning Objectives:</h4>
                        <ul className="space-y-1">
                          {lesson.learningObjectives.map((objective, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="mr-2">•</span>
                              {objective}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Materials */}
                {lesson.content.materials.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Learning Materials</h3>
                    <div className="space-y-4">
                      {lesson.content.materials.map((material, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center mb-2">
                            <span className="mr-2">
                              {material.type === 'text' && '📄'}
                              {material.type === 'audio' && '🎵'}
                              {material.type === 'video' && '🎥'}
                              {material.type === 'image' && '🖼️'}
                            </span>
                            <span className="font-medium text-gray-900 capitalize">{material.type}</span>
                          </div>
                          
                          {material.type === 'text' && (
                            <div className="prose prose-sm text-gray-700">
                              <p>{material.content}</p>
                            </div>
                          )}
                          
                          {material.type === 'audio' && (
                            <audio controls className="w-full">
                              <source src={material.fileUrl} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          )}
                          
                          {material.type === 'video' && (
                            <video controls className="w-full rounded">
                              <source src={material.fileUrl} type="video/mp4" />
                              Your browser does not support the video element.
                            </video>
                          )}
                          
                          {material.type === 'image' && (
                            <img 
                              src={material.fileUrl || material.content} 
                              alt="Lesson material"
                              className="w-full rounded"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Exercise */}
                {currentExercise && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Exercise {currentStep + 1} of {lesson.content.exercises.length}
                      </h3>
                      <span className="text-sm text-gray-500 capitalize">{currentExercise.type}</span>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-lg text-gray-900">{currentExercise.question}</p>
                    </div>

                    {/* Answer Options */}
                    <div className="space-y-3">
                      {currentExercise.type === 'multiple-choice' && currentExercise.options && (
                        currentExercise.options.map((option, index) => (
                          <label key={index} className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name={`exercise-${currentStep}`}
                              value={option}
                              checked={answers[currentStep] === option}
                              onChange={(e) => handleAnswerChange(currentStep, e.target.value)}
                              className="mr-3"
                            />
                            <span className="text-gray-900">{option}</span>
                          </label>
                        ))
                      )}
                      
                      {currentExercise.type === 'fill-blank' && (
                        <input
                          type="text"
                          value={answers[currentStep] || ''}
                          onChange={(e) => handleAnswerChange(currentStep, e.target.value)}
                          placeholder="Enter your answer..."
                          className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      
                      {currentExercise.type === 'essay' && (
                        <textarea
                          value={answers[currentStep] || ''}
                          onChange={(e) => handleAnswerChange(currentStep, e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                        />
                      )}
                      
                      {currentExercise.type === 'matching' && currentExercise.options && (
                        <div className="space-y-3">
                          {currentExercise.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-700 w-20">
                                {index + 1}.
                              </span>
                              <input
                                type="text"
                                value={answers[`${currentStep}-${index}`] || ''}
                                onChange={(e) => handleAnswerChange(`${currentStep}-${index}`, e.target.value)}
                                placeholder="Match with..."
                                className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <button
                    onClick={handlePreviousStep}
                    disabled={currentStep === 0}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <button
                    onClick={handleNextStep}
                    disabled={currentStep === lesson.content.exercises.length - 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar - Exercise Navigator */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Exercise Navigator</h3>
                
                <div className="space-y-2">
                  {lesson.content.exercises.map((exercise, index) => {
                    const isAnswered = answers[index] !== undefined;
                    const isCurrent = index === currentStep;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentStep(index)}
                        className={`w-full p-3 text-left rounded-lg border transition-colors ${
                          isCurrent 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : isAnswered 
                              ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Exercise {index + 1}</span>
                          <span className="text-xs capitalize">{exercise.type}</span>
                        </div>
                        {isAnswered && !isCurrent && (
                          <div className="text-xs mt-1">✓ Answered</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Submit Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Lesson?</h3>
              <p className="text-gray-600 mb-6">
                You have completed {Object.keys(answers).length} out of {lesson.content.exercises.length} exercises. 
                Are you sure you want to complete this lesson?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Continue Lesson
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Complete Lesson'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 