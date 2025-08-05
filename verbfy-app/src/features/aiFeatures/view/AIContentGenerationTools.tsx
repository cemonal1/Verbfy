import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AIContentGeneration, AIContentGenerationRequest } from '@/types/aiFeatures';
import { aiFeaturesAPI } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';

interface AIContentGenerationToolsProps {
  userRole: 'teacher' | 'admin';
}

export const AIContentGenerationTools: React.FC<AIContentGenerationToolsProps> = ({
  userRole
}) => {
  const router = useRouter();
  const { user } = useAuthContext();
  const [generatedContent, setGeneratedContent] = useState<AIContentGeneration[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedContent, setSelectedContent] = useState<AIContentGeneration | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState<AIContentGenerationRequest>({
    type: 'lesson',
    title: '',
    description: '',
    cefrLevel: 'A1',
    difficulty: 'Beginner',
    category: '',
    subcategory: '',
    learningObjectives: [''],
    estimatedDuration: 30,
    tags: [],
    customPrompt: '',
    includeExercises: true,
    includeVocabulary: true,
    includeGrammar: true,
    includeAudio: false,
    includeImages: false
  });

  useEffect(() => {
    fetchGeneratedContent();
  }, []);

  const fetchGeneratedContent = async () => {
    try {
      setLoading(true);
      const response = await aiFeaturesAPI.getGeneratedContent({
        page: 1,
        limit: 20
      });
      setGeneratedContent(response.content);
    } catch (error) {
      console.error('Error fetching generated content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AIContentGenerationRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLearningObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.learningObjectives];
    newObjectives[index] = value;
    setFormData(prev => ({
      ...prev,
      learningObjectives: newObjectives
    }));
  };

  const addLearningObjective = () => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, '']
    }));
  };

  const removeLearningObjective = (index: number) => {
    if (formData.learningObjectives.length > 1) {
      const newObjectives = formData.learningObjectives.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        learningObjectives: newObjectives
      }));
    }
  };

  const handleTagChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const generateContent = async () => {
    try {
      setGenerating(true);
      const response = await aiFeaturesAPI.generateContent(formData);
      
      // Add the new content to the list
      setGeneratedContent(prev => [response.content, ...prev]);
      
      // Reset form
      setFormData({
        type: 'lesson',
        title: '',
        description: '',
        cefrLevel: 'A1',
        difficulty: 'Beginner',
        category: '',
        subcategory: '',
        learningObjectives: [''],
        estimatedDuration: 30,
        tags: [],
        customPrompt: '',
        includeExercises: true,
        includeVocabulary: true,
        includeGrammar: true,
        includeAudio: false,
        includeImages: false
      });
      
      // Show success message
      alert('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Error generating content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleReviewContent = async (contentId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      await aiFeaturesAPI.reviewContent(contentId, { status, notes });
      fetchGeneratedContent();
    } catch (error) {
      console.error('Error reviewing content:', error);
    }
  };

  const getContentTypeIcon = (type: string) => {
    const icons = {
      lesson: '📚',
      exercise: '✏️',
      story: '📖',
      dialogue: '💬',
      quiz: '❓',
      material: '📄'
    };
    return icons[type as keyof typeof icons] || '📊';
  };

  const getReviewStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      needs_revision: 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content generation tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Content Generation</h1>
              <p className="text-gray-600 mt-1">
                Generate high-quality learning content using AI
              </p>
            </div>
            <div className="text-sm text-gray-500">
              AI Model: GPT-4 | Version: 1.0
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generation Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Content</h2>
            
            <div className="space-y-4">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lesson">Lesson</option>
                  <option value="exercise">Exercise</option>
                  <option value="story">Story</option>
                  <option value="dialogue">Dialogue</option>
                  <option value="quiz">Quiz</option>
                  <option value="material">Material</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter content title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the content..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* CEFR Level and Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEFR Level
                  </label>
                  <select
                    value={formData.cefrLevel}
                    onChange={(e) => handleInputChange('cefrLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="A1">A1 - Beginner</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                    <option value="C2">C2 - Proficient</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Category and Subcategory */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="e.g., Grammar, Vocabulary"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    placeholder="e.g., Present Perfect"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Objectives
                </label>
                {formData.learningObjectives.map((objective, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => handleLearningObjectiveChange(index, e.target.value)}
                      placeholder={`Learning objective ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.learningObjectives.length > 1 && (
                      <button
                        onClick={() => removeLearningObjective(index)}
                        className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addLearningObjective}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Learning Objective
                </button>
              </div>

              {/* Duration and Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value))}
                    min="5"
                    max="180"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={(e) => handleTagChange(e.target.value)}
                    placeholder="e.g., grammar, present perfect, exercises"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Prompt (Optional)
                </label>
                <textarea
                  value={formData.customPrompt}
                  onChange={(e) => handleInputChange('customPrompt', e.target.value)}
                  placeholder="Add specific instructions for the AI..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Content Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Options
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includeExercises}
                      onChange={(e) => handleInputChange('includeExercises', e.target.checked)}
                      className="mr-2"
                    />
                    Include Exercises
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includeVocabulary}
                      onChange={(e) => handleInputChange('includeVocabulary', e.target.checked)}
                      className="mr-2"
                    />
                    Include Vocabulary
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includeGrammar}
                      onChange={(e) => handleInputChange('includeGrammar', e.target.checked)}
                      className="mr-2"
                    />
                    Include Grammar
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includeAudio}
                      onChange={(e) => handleInputChange('includeAudio', e.target.checked)}
                      className="mr-2"
                    />
                    Include Audio
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateContent}
                disabled={generating || !formData.title || !formData.description}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Generating...' : 'Generate Content'}
              </button>
            </div>
          </div>

          {/* Generated Content List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Content</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {generatedContent.map((content) => (
                <div key={content._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="text-xl">{getContentTypeIcon(content.type)}</div>
                      <div>
                        <h3 className="font-medium text-gray-900 line-clamp-1">{content.title}</h3>
                        <p className="text-sm text-gray-500">{content.category}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(content.cefrLevel)}`}>
                        {content.cefrLevel}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReviewStatusColor(content.reviewStatus)}`}>
                        {content.reviewStatus}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{content.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>Duration: {content.estimatedDuration} min</span>
                    <span>Quality: {content.qualityScore}/10</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>👁️ {content.usageCount}</span>
                      <span>⭐ {content.averageRating.toFixed(1)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedContent(content);
                          setShowPreview(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                      >
                        Preview
                      </button>
                      {content.reviewStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReviewContent(content._id, 'approved')}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewContent(content._id, 'rejected')}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {generatedContent.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">🤖</div>
                  <p className="text-gray-500">No generated content yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Preview Modal */}
        {showPreview && selectedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Content Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedContent.title}</h3>
                  <p className="text-gray-600">{selectedContent.description}</p>
                </div>
                
                {selectedContent.content.text && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                    <div className="prose max-w-none text-sm">
                      {selectedContent.content.text}
                    </div>
                  </div>
                )}
                
                {selectedContent.content.exercises && selectedContent.content.exercises.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Exercises</h4>
                    <div className="space-y-3">
                      {selectedContent.content.exercises.map((exercise, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <p className="font-medium mb-2">{exercise.question}</p>
                          {exercise.options && (
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {exercise.options.map((option, optIndex) => (
                                <li key={optIndex}>{option}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedContent.content.vocabulary && selectedContent.content.vocabulary.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Vocabulary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedContent.content.vocabulary.map((vocab, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="font-medium">{vocab.word}</div>
                          <div className="text-sm text-gray-600">{vocab.definition}</div>
                          <div className="text-sm text-gray-500 italic">{vocab.example}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 