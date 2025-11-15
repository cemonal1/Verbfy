import { Request, Response } from 'express';
import { LiveKitService } from '../services/livekitService';
import { createLogger } from '../utils/logger';
const livekitLogger = createLogger('LivekitController');

interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export class LiveKitController {
  private livekitService: LiveKitService;

  constructor() {
    this.livekitService = new LiveKitService();
  }

  generateToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { roomName } = req.params;
      const { metadata } = req.body;

      if (!roomName) {
        res.status(400).json({
          error: 'Room name is required'
        });
        return;
      }

      if (!req.user?.id || !req.user?.name) {
        res.status(401).json({
          error: 'User not authenticated'
        });
        return;
      }

      // Validate room access
      const accessValidation = await this.livekitService.validateRoomAccess(
        req.user.id,
        roomName
      );

      if (!accessValidation.isValid) {
        res.status(403).json({
          error: 'Access denied',
          reason: accessValidation.reason
        });
        return;
      }

      // Generate token
      const { token, url, isCloud } = await this.livekitService.generateToken({
        userId: req.user.id,
        userName: req.user.name,
        roomName,
        metadata
      });

      res.json({
        token,
        url,
        isCloud,
        room: roomName
      });
    } catch (error) {
      livekitLogger.error('Failed to generate LiveKit token:', error);
      res.status(500).json({
        error: 'Failed to generate token'
      });
    }
  };

  validateAccess = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { roomName } = req.params;

      if (!roomName) {
        res.status(400).json({
          error: 'Room name is required'
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({
          error: 'User not authenticated'
        });
        return;
      }

      const validation = await this.livekitService.validateRoomAccess(
        req.user.id,
        roomName
      );

      res.json(validation);
    } catch (error) {
      livekitLogger.error('Failed to validate room access:', error);
      res.status(500).json({
        error: 'Failed to validate room access'
      });
    }
  };
} 