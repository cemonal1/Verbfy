import React from 'react';
import { X, User, Crown, GraduationCap } from 'lucide-react';
import { LessonParticipant } from '../hooks/useLessonChat';

interface LessonParticipantsProps {
  participants: LessonParticipant[];
  onClose: () => void;
}

export const LessonParticipants: React.FC<LessonParticipantsProps> = ({
  participants,
  onClose
}) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher':
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case 'admin':
        return <Crown className="w-4 h-4 text-purple-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'text-blue-600 bg-blue-50';
      case 'admin':
        return 'text-purple-600 bg-purple-50';
      case 'student':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatJoinTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">
            Participants ({participants.length})
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-32 overflow-y-auto">
          {participants.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No participants yet</p>
            </div>
          ) : (
            participants.map((participant) => (
              <div
                key={participant.userId}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-2">
                  {getRoleIcon(participant.userRole)}
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {participant.userName}
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${getRoleColor(participant.userRole)}`}>
                      {participant.userRole}
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  {formatJoinTime(participant.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};