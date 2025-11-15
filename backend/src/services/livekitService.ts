import { livekitConfig } from '../config/livekit';
import { Reservation } from '../models/Reservation';
import { createLogger } from '../utils/logger';
const livekitLogger = createLogger('LivekitService');

export class LiveKitService {
  /**
   * Determines if a room should use LiveKit Cloud or self-hosted
   * @param roomId - The room/reservation ID
   * @returns boolean - true for cloud, false for self-hosted
   */
  private async shouldUseCloud(roomId: string): Promise<boolean> {
    try {
      // Extract reservation ID from room name (format: lesson-{reservationId})
      let reservationId = roomId;
      if (roomId.startsWith('lesson-')) {
        reservationId = roomId.replace('lesson-', '');
      }
      
      // If it's a reservation ID, check if it's a paid lesson
      const reservation = await Reservation.findById(reservationId);
      if (reservation) {
        // Use cloud for paid lessons, self-hosted for free rooms
        return reservation.isPaid === true;
      }
      
      // For non-reservation rooms (e.g., group chat), use self-hosted
      return false;
    } catch (error) {
      livekitLogger.error('Error determining LiveKit server:', error);
      // Default to self-hosted on error
      return false;
    }
  }

  /**
   * Generates a LiveKit token for a user to join a room
   */
  async generateToken(params: {
    userId: string;
    userName: string;
    roomName: string;
    metadata?: string;
  }): Promise<{
    token: string;
    url: string;
    isCloud: boolean;
  }> {
    try {
      const isCloud = await this.shouldUseCloud(params.roomName);
      
      const token = await livekitConfig.generateToken({
        userId: params.userId,
        userName: params.userName,
        roomName: params.roomName,
        isCloud,
        metadata: params.metadata
      });

      const url = livekitConfig.getServerUrl(isCloud);

      return {
        token,
        url,
        isCloud
      };
    } catch (error) {
      livekitLogger.error('Failed to generate LiveKit token:', error);
      throw error;
    }
  }

  /**
   * Validates if a user has access to a room
   */
  async validateRoomAccess(userId: string, roomName: string): Promise<{
    isValid: boolean;
    reason?: string;
    isCloud?: boolean;
  }> {
    try {
      // Extract reservation ID from room name (format: lesson-{reservationId})
      let reservationId = roomName;
      if (roomName.startsWith('lesson-')) {
        reservationId = roomName.replace('lesson-', '');
      }
      
      const reservation = await Reservation.findById(reservationId)
        .populate('teacher', 'name email')
        .populate('student', 'name email');

      // If no reservation found, it might be a free conversation room
      if (!reservation) {
        // TODO: Add logic for free conversation rooms
        return { isValid: true, isCloud: false };
      }

      // Check if user is teacher or student
      const isTeacher = reservation.teacher._id.toString() === userId;
      const isStudent = reservation.student._id.toString() === userId;

      if (!isTeacher && !isStudent) {
        return {
          isValid: false,
          reason: 'USER_NOT_IN_RESERVATION',
          isCloud: reservation.isPaid
        };
      }

      // Check reservation status
      if (!['booked', 'inProgress'].includes(reservation.status)) {
        return {
          isValid: false,
          reason: 'INVALID_RESERVATION_STATUS',
          isCloud: reservation.isPaid
        };
      }

      // Check if lesson has ended
      const now = new Date();
      const lessonDate = new Date(reservation.actualDate);
      const [endHour, endMin] = reservation.endTime.split(':').map(Number);
      const lessonEndTime = new Date(lessonDate);
      lessonEndTime.setHours(endHour, endMin, 0, 0);

      if (now > lessonEndTime) {
        return {
          isValid: false,
          reason: 'LESSON_ENDED',
          isCloud: reservation.isPaid
        };
      }

      // For students: check time window
      if (isStudent) {
        const [startHour, startMin] = reservation.startTime.split(':').map(Number);
        const lessonStartTime = new Date(lessonDate);
        lessonStartTime.setHours(startHour, startMin, 0, 0);
        
        const timeBeforeStart = (lessonStartTime.getTime() - now.getTime()) / (1000 * 60);
        const timeWindow = process.env.NODE_ENV === 'production' ? 15 : 1440; // 15 min in prod, 24h in dev

        if (timeBeforeStart > timeWindow) {
          return {
            isValid: false,
            reason: 'TOO_EARLY',
            isCloud: reservation.isPaid
          };
        }
      }

      return {
        isValid: true,
        isCloud: reservation.isPaid
      };
    } catch (error) {
      livekitLogger.error('Error validating room access:', error);
      throw error;
    }
  }
}