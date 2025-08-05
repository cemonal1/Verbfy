import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { CreateCurriculumRequest } from '@/types/personalizedCurriculum';
import { personalizedCurriculumAPI } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';

export const CurriculumCreationTool: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCurriculumRequest>({
    currentCEFRLevel: 'A1',
    targetCEFRLevel: 'A2',
    learningGoals: []
  });

  const cefrLevels = [
    { value: 'A1', label: 'A1 - Beginner', description: 'Can understand and use familiar everyday expressions' },
    { value: 'A2', label: 'A2 - Elementary', description: 'Can communicate in simple and routine tasks' },
    { value: 'B1', label: 'B1 - Intermediate', description: 'Can deal with most situations while traveling' },
    { value: 'B2', label: 'B2 - Upper Intermediate', description: 'Can interact with fluency and spontaneity' },
    { value: 'C1', label: 'C1 - Advanced', description: 'Can express ideas fluently and spontaneously' },
    { value: 'C2', label: 'C2 - Proficient', description: 'Can understand virtually everything heard or read' }
  ];

  const skills = [
    { value: 'grammar', label: 'Grammar', icon: '📝', description: 'Sentence structure and language rules' },
    { value: 'reading', label: 'Reading', icon: '📖', description: 'Comprehension and interpretation' },
    { value: 'writing', label: 'Writing', icon: '✍️', description: 'Composition and expression' },
    { value: 'speaking', label: 'Speaking', icon: '🗣️', description: 'Oral communication and pronunciation' },
    { value: 'listening', label: 'Listening', icon: '👂', description: 'Audio comprehension and understanding' },
    { value: 'vocabulary', label: 'Vocabulary', icon: '📚', description: 'Word knowledge and usage' }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High Priority', color: 'bg-red-100 text-red-800' }
  ];

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSkillToggle = (skill: string) => {
    const existingGoal = formData.learningGoals.find(goal => goal.skill === skill);
    if (existingGoal) {
      setFormData(prev => ({
        ...prev,
        learningGoals: prev.learningGoals.filter(goal => goal.skill !== skill)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        learningGoals: [...prev.learningGoals, {
          skill: skill as any,
          currentLevel: 1,
          targetLevel: 3,
          priority: 'medium'
        }]
      }));
    }
  };

  const updateGoal = (skill: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.map(goal => 
        goal.skill === skill ? { ...goal, [field]: value } : goal
      )
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await personalizedCurriculumAPI.createCurriculum(formData);
      router.push('/curriculum/dashboard');
    } catch (error) {
      console.error('Error creating curriculum:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLevel = (skill: string) => {
    const goal = formData.learningGoals.find(g => g.skill === skill);
    return goal?.currentLevel || 1;
  };

  const getTargetLevel = (skill: string) => {
    const goal = formData.learningGoals.find(g => g.skill === skill);
    return goal?.targetLevel || 3;
  };

  const getPriority = (skill: string) => {
    const goal = formData.learningGoals.find(g => g.skill === skill);
    return goal?.priority || 'medium';
  };

  const isSkillSelected = (skill: string) => {
    return formData.learningGoals.some(goal => goal.skill === skill);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Create Your Curriculum</h1>
            <span className="text-sm text-gray-500">Step {currentStep} of 3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Current and Target Levels */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">What's your current English level?</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Current CEFR Level</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cefrLevels.map((level) => (
                    <label
                      key={level.value}
                      className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                        formData.currentCEFRLevel === level.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="currentLevel"
                        value={level.value}
                        checked={formData.currentCEFRLevel === level.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentCEFRLevel: e.target.value as any }))}
                        className="sr-only"
                      />
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{level.label}</p>
                            <p className="text-gray-500">{level.description}</p>
                          </div>
                        </div>
                        {formData.currentCEFRLevel === level.value && (
                          <div className="shrink-0 text-blue-600">
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Target CEFR Level</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cefrLevels
                    .filter(level => level.value !== formData.currentCEFRLevel)
                    .map((level) => (
                      <label
                        key={level.value}
                        className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                          formData.targetCEFRLevel === level.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="targetLevel"
                          value={level.value}
                          checked={formData.targetCEFRLevel === level.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, targetCEFRLevel: e.target.value as any }))}
                          className="sr-only"
                        />
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">{level.label}</p>
                              <p className="text-gray-500">{level.description}</p>
                            </div>
                          </div>
                          {formData.targetCEFRLevel === level.value && (
                            <div className="shrink-0 text-blue-600">
                              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleNext}
                disabled={!formData.currentCEFRLevel || !formData.targetCEFRLevel}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Learning Goals */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">What skills do you want to focus on?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {skills.map((skill) => (
                <div
                  key={skill.value}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    isSkillSelected(skill.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => handleSkillToggle(skill.value)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{skill.icon}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{skill.label}</h3>
                      <p className="text-sm text-gray-500">{skill.description}</p>
                    </div>
                  </div>
                  {isSkillSelected(skill.value) && (
                    <div className="absolute top-2 right-2 text-blue-600">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Skills Configuration */}
            {formData.learningGoals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Configure Your Goals</h3>
                {formData.learningGoals.map((goal) => (
                  <div key={goal.skill} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="text-xl">{skills.find(s => s.value === goal.skill)?.icon}</div>
                      <h4 className="font-medium text-gray-900 capitalize">{goal.skill}</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Level</label>
                        <select
                          value={goal.currentLevel}
                          onChange={(e) => updateGoal(goal.skill, 'currentLevel', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {[1, 2, 3, 4, 5].map(level => (
                            <option key={level} value={level}>Level {level}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Level</label>
                        <select
                          value={goal.targetLevel}
                          onChange={(e) => updateGoal(goal.skill, 'targetLevel', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {[1, 2, 3, 4, 5].map(level => (
                            <option key={level} value={level}>Level {level}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select
                          value={goal.priority}
                          onChange={(e) => updateGoal(goal.skill, 'priority', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {priorities.map(priority => (
                            <option key={priority.value} value={priority.value}>{priority.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button
                onClick={handlePrevious}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-2 rounded-md"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={formData.learningGoals.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Create */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Curriculum</h2>
            
            <div className="space-y-6">
              {/* Level Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Learning Journey</h3>
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {formData.currentCEFRLevel}
                  </span>
                  <span className="text-gray-500">→</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {formData.targetCEFRLevel}
                  </span>
                </div>
              </div>

              {/* Goals Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Learning Goals ({formData.learningGoals.length})</h3>
                <div className="space-y-2">
                  {formData.learningGoals.map((goal) => (
                    <div key={goal.skill} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{skills.find(s => s.value === goal.skill)?.icon}</span>
                        <span className="font-medium capitalize">{goal.skill}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Level {goal.currentLevel} → {goal.targetLevel}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                          goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {goal.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimated Timeline */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Estimated Timeline</h3>
                <p className="text-gray-600">
                  Based on your goals, we estimate it will take approximately{' '}
                  <span className="font-medium text-blue-600">
                    {Math.max(30, formData.learningGoals.length * 20)} days
                  </span>{' '}
                  to reach your target level with regular study sessions.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={handlePrevious}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-2 rounded-md"
              >
                Previous
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Curriculum'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 