import React from 'react';
import { useChat } from '../../context/ChatContext';
import { Conversation, formatConversationTime, truncateMessage } from '../../types/chat';

interface ConversationListProps {
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export default function ConversationList({ 
  onConversationSelect, 
  selectedConversationId 
}: ConversationListProps) {
  const { state } = useChat();
  const { conversations, loading, error } = state;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading conversations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">💬</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No conversations yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Start a conversation with a teacher or student to begin chatting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation._id}
          conversation={conversation}
          isSelected={conversation._id === selectedConversationId}
          onClick={() => onConversationSelect(conversation)}
        />
      ))}
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const { otherParticipant, lastMessage, unreadCount, updatedAt } = conversation;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center space-x-3 p-4 rounded-lg cursor-pointer transition-colors
        ${isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }
      `}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          {otherParticipant.avatar ? (
            <img
              src={otherParticipant.avatar}
              alt={otherParticipant.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-medium text-blue-600 dark:text-blue-400">
              {otherParticipant.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {otherParticipant.name}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatConversationTime(updatedAt)}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {lastMessage ? (
              <>
                <span className="font-medium">
                  {lastMessage.sender === otherParticipant._id ? otherParticipant.name : 'You'}:
                </span>{' '}
                {truncateMessage(lastMessage.content, 30)}
              </>
            ) : (
              'No messages yet'
            )}
          </p>
          
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <div className="flex-shrink-0 ml-2">
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </div>
          )}
        </div>

        {/* Role badge */}
        <div className="mt-1">
          <span className={`
            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
            ${otherParticipant.role === 'teacher'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }
          `}>
            {otherParticipant.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
          </span>
        </div>
      </div>
    </div>
  );
} 