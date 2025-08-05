import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth, useRoleGuard } from '../../src/context/AuthContext';
import { useChat } from '../../src/context/ChatContext';
import DashboardLayout from '../../src/components/layout/DashboardLayout';
import ConversationList from '../../src/components/chat/ConversationList';
import ChatInterface from '../../src/components/chat/ChatInterface';
import { Conversation } from '../../src/types/chat';

export default function ChatPage() {
  const { hasAccess, isLoading } = useRoleGuard(['student', 'teacher']);
  const { state } = useChat();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <>
      <Head>
        <title>Chat - Verbfy</title>
        <meta name="description" content="Real-time messaging with teachers and students" />
      </Head>

      <DashboardLayout 
        allowedRoles={['student', 'teacher']}
        title="Chat"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Messages
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with teachers and students through real-time messaging
            </p>
          </div>

          {/* Chat Interface */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[600px]">
            <div className="flex h-full">
              {/* Conversation List */}
              <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Conversations
                  </h2>
                </div>
                <div className="h-[calc(600px-80px)] overflow-y-auto">
                  <ConversationList
                    onConversationSelect={handleConversationSelect}
                    selectedConversationId={selectedConversation?._id}
                  />
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1">
                {selectedConversation ? (
                  <ChatInterface
                    conversationId={selectedConversation._id}
                    otherParticipant={selectedConversation.otherParticipant}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-4xl mb-4">💬</div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Choose a conversation from the list to start messaging.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features Info */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Real-time Messaging
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Send and receive messages instantly with live updates and typing indicators.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Secure Communication
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All messages are encrypted and only visible to conversation participants.
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Cross-platform
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Access your conversations from any device with automatic synchronization.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 