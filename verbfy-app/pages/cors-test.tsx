import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { corsTestAPI } from '@/lib/api';

export default function CORSTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testCORS = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await corsTestAPI.testCORS();
      setResult(response.data);
      console.log('✅ CORS Test Success:', response.data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      console.error('❌ CORS Test Failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['student', 'teacher', 'admin']}>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">CORS Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={testCORS}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test CORS'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-semibold mb-2">CORS Test Result:</h3>
            <pre className="text-green-700 text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
