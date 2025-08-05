import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth, useRoleGuard } from '../../src/context/AuthContext';
import { useChat } from '../../src/context/ChatContext';
import DashboardLayout from '../../src/components/layout/DashboardLayout';
import ChatInterface from '../../src/components/chat/ChatInterface';
import { Conversation } from '../../src/types/chat';
import api from '../../src/lib/api';

export default function ChatConversationPage() {
  const router = useRouter();
  const { id: conversationId } = router.query;
  const { hasAccess, isLoading } = useRoleGuard(['student', 'teacher']);
  const { state, actions } = useChat();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversation data when ID changes
  useEffect(() => {
    if (conversationId && typeof conversationId === 'string') {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  const loadConversation = async (convId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/api/chat/conversations/${convId}`);
      
      if (response.data.success) {
        setConversation(response.data.data);
      } else {
        setError('Conversation not found');
      }
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load conversation';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Only students and teachers can access the chat system.
          </p>
        </div>
      </div>
    );
  }

  // Show error if conversation not found
  if (error) {
    return (
      <DashboardLayout allowedRoles={['student', 'teacher']} title="Chat">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Conversation Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={() => router.push('/chat')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Chat
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading if conversation not loaded yet
  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Chat with {conversation.otherParticipant.name} - Verbfy</title>
        <meta name="description" content={`Chat with ${conversation.otherParticipant.name}`} />
      </Head>

      <DashboardLayout 
        allowedRoles={['student', 'teacher']}
        title={`Chat with ${conversation.otherParticipant.name}`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Chat with {conversation.otherParticipant.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {conversation.otherParticipant.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                </p>
              </div>
              <button
                onClick={() => router.push('/chat')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back to Conversations
              </button>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[600px]">
            <ChatInterface
              conversationId={conversation._id}
              otherParticipant={conversation.otherParticipant}
            />
          </div>

          {/* Conversation Info */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Conversation Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Participant</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {conversation.otherParticipant.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                <p className="text-gray-900 dark:text-white font-medium capitalize">
                  {conversation.otherParticipant.role}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {conversation.otherParticipant.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Started</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {new Date(conversation.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 