import React from 'react';

interface LessonRoomProps {
  reservationId: string;
}

const LessonRoom: React.FC<LessonRoomProps> = ({ reservationId }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Lesson Room</h1>
          <p className="text-xl text-gray-600 mb-6">Coming Soon - Real-time lesson session</p>
          <p className="text-sm text-gray-500">Reservation ID: {reservationId}</p>
        </div>
      </div>
    </div>
  );
};

export default LessonRoom; 