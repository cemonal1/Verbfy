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
      const response = await (verbfyLessonsAPI as any).getLesson?.(lessonId);
      if (response) {
        // Support both API shapes used in tests
        const normalized: VerbfyLesson = (response as any).lesson ? {
          _id: (response as any).lesson.id || lessonId,
          title: (response as any).lesson.title,
          description: (response as any).lesson.description || '',
          lessonType: (response as any).lesson.type || 'VerbfyGrammar',
          cefrLevel: (response as any).lesson.cefrLevel || 'A1',
          difficulty: (response as any).lesson.difficulty || 'Beginner',
          category: '',
          estimatedDuration: (response as any).lesson.estimatedDuration || 0,
          content: {
            instructions: (response as any).lesson.instructions || '',
            materials: (response as any).lesson.materials || [],
            exercises: (response as any).lesson.exercises || [],
          },
          learningObjectives: [],
          tags: [],
          isActive: true,
          isPremium: false,
          createdBy: { _id: '', name: '' },
          averageRating: 0,
          totalRatings: 0,
          completionRate: 0,
          averageCompletionTime: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } : (response as any);
        setLesson(normalized);
      }
      const startResponse = await (verbfyLessonsAPI as any).startLesson?.(lessonId);
      setAttemptId(startResponse?.attemptId || lessonId);
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
    if (currentExercise < (lesson?.content?.exercises?.length || 0) - 1) {
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
      const result = await (verbfyLessonsAPI as any).submitLesson?.(attemptId, {
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
    if (!lesson?.content?.exercises) return 0;
    const totalExercises = lesson.content.exercises.length;
    const answeredExercises = Object.keys(answers).length;
    return (answeredExercises / totalExercises) * 100;
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{lesson.title}</h1>
              <p className="text-gray-600 mt-1">Follow the instructions and complete the exercises</p>
            </div>
            <div className="text-sm text-gray-500">
              <span>Time spent: {formatTime(timeSpent)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {showInstructions ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h2>
              <p className="text-gray-700 mb-4">{lesson.content?.instructions || 'Read the instructions carefully.'}</p>
              <button
                onClick={() => setShowInstructions(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Start Lesson
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h2>
              {/* Exercise content would go here */}
              <div className="mt-6 flex justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentExercise === 0}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {currentExercise < (lesson.content?.exercises?.length || 0) - 1 ? 'Next' : 'Submit'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 