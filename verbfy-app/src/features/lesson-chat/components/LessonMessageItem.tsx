import React from 'react';
import { Download, FileText, Image, Video, Music, FileIcon } from 'lucide-react';
import { LessonMessage } from '../hooks/useLessonChat';
import { useAuth } from '@/context/AuthContext';

interface LessonMessageItemProps {
  message: LessonMessage;
  lessonId: string;
}

export const LessonMessageItem: React.FC<LessonMessageItemProps> = ({
  message,
  lessonId
}) => {
  const { user } = useAuth();
  const isOwnMessage = user?.id === message.userId;
  const isSystemMessage = message.messageType === 'system';

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'text-blue-600';
      case 'student':
        return 'text-green-600';
      case 'admin':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image className="w-4 h-4" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return <Video className="w-4 h-4" />;
      case 'mp3':
      case 'wav':
      case 'ogg':
        return <Music className="w-4 h-4" />;
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileIcon className="w-4 h-4" />;
    }
  };

  const handleFileDownload = async () => {
    if (!message.fileId) return;

    try {
      const response = await fetch(`/api/lesson-chat/${lessonId}/files/${message.fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = message.message.replace('Shared file: ', '');
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  if (isSystemMessage) {
    return (
      <div className="flex justify-center">
        <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
          {message.message}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Message Header */}
        <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-sm font-medium ${getRoleColor(message.userRole)}`}>
            {message.userName}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadge(message.userRole)}`}>
            {message.userRole}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Message Content */}
        <div
          className={`px-3 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {message.messageType === 'file' ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {getFileIcon(message.message)}
                <span className="text-sm">{message.message.replace('Shared file: ', '')}</span>
              </div>
              <button
                onClick={handleFileDownload}
                className={`p-1 rounded hover:bg-opacity-80 ${
                  isOwnMessage ? 'hover:bg-blue-600' : 'hover:bg-gray-200'
                }`}
                title="Download file"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};