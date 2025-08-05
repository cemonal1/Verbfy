import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CEFRTest, TestFilters } from '@/types/cefrTests';
import { cefrTestsAPI } from '@/lib/api';

interface CEFRTestListProps {
  onTestSelect?: (test: CEFRTest) => void;
  showFilters?: boolean;
  limit?: number;
}

export const CEFRTestList: React.FC<CEFRTestListProps> = ({
  onTestSelect,
  showFilters = true,
  limit = 10
}) => {
  const router = useRouter();
  const [tests, setTests] = useState<CEFRTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TestFilters>({
    page: 1,
    limit
  });

  useEffect(() => {
    fetchTests();
  }, [filters]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await cefrTestsAPI.getTests(filters);
      setTests(response.tests);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestClick = (test: CEFRTest) => {
    if (onTestSelect) {
      onTestSelect(test);
    } else {
      router.push(`/cefr-tests/${test._id}`);
    }
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

  const getTestTypeColor = (type: string) => {
    const colors = {
      placement: 'bg-blue-100 text-blue-800',
      progress: 'bg-green-100 text-green-800',
      certification: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-4"></div>
            <div className="flex gap-2 mb-4">
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
              <div className="h-6 w-20 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Filter Tests</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.cefrLevel || ''}
              onChange={(e) => setFilters({ ...filters, cefrLevel: e.target.value || undefined })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="A1">A1 - Beginner</option>
              <option value="A2">A2 - Elementary</option>
              <option value="B1">B1 - Intermediate</option>
              <option value="B2">B2 - Upper Intermediate</option>
              <option value="C1">C1 - Advanced</option>
              <option value="C2">C2 - Proficient</option>
            </select>

            <select
              value={filters.testType || ''}
              onChange={(e) => setFilters({ ...filters, testType: e.target.value || undefined })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="placement">Placement Test</option>
              <option value="progress">Progress Test</option>
              <option value="certification">Certification Test</option>
            </select>

            <select
              value={filters.isPremium ? 'true' : filters.isPremium === false ? 'false' : ''}
              onChange={(e) => setFilters({ 
                ...filters, 
                isPremium: e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined 
              })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tests</option>
              <option value="false">Free Tests</option>
              <option value="true">Premium Tests</option>
            </select>

            <input
              type="text"
              placeholder="Search tests..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <div
            key={test._id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => handleTestClick(test)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {test.title}
                </h3>
                {test.isPremium && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    Premium
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {test.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(test.cefrLevel)}`}>
                  {test.cefrLevel}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTestTypeColor(test.testType)}`}>
                  {test.testType.charAt(0).toUpperCase() + test.testType.slice(1)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>⏱️ {test.totalTime} min</span>
                <span>📝 {test.totalQuestions} questions</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>⭐ {test.averageScore.toFixed(1)}</span>
                  <span>👥 {test.totalAttempts} attempts</span>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  Start Test
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tests.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later for new tests.</p>
        </div>
      )}
    </div>
  );
}; 