import { Request, Response } from 'express';
import { LiveKitService } from '../services/livekitService';

export class LiveKitController {
  private livekitService: LiveKitService;

  constructor() {
    this.livekitService = new LiveKitService();
  }

  /**
   * Generate a LiveKit token for room access
   */
  async generateToken(req: Request, res: Response) {
    try {
      const { roomName } = req.params;
      const { metadata } = req.body;

      if (!roomName) {
        return res.status(400).json({
          error: 'Room name is required'
        });
      }

      // Validate room access
      const accessValidation = await this.livekitService.validateRoomAccess(
        req.user!.id,
        roomName
      );

      if (!accessValidation.isValid) {
        return res.status(403).json({
          error: 'Access denied',
          reason: accessValidation.reason
        });
      }

      // Generate token
      const { token, url, isCloud } = await this.livekitService.generateToken({
        userId: req.user!.id,
        userName: req.user!.name,
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
      console.error('Failed to generate LiveKit token:', error);
      res.status(500).json({
        error: 'Failed to generate token'
      });
    }
  }

  /**
   * Validate access to a room
   */
  async validateAccess(req: Request, res: Response) {
    try {
      const { roomName } = req.params;

      if (!roomName) {
        return res.status(400).json({
          error: 'Room name is required'
        });
      }

      const validation = await this.livekitService.validateRoomAccess(
        req.user!.id,
        roomName
      );

      res.json(validation);
    } catch (error) {
      console.error('Failed to validate room access:', error);
      res.status(500).json({
        error: 'Failed to validate room access'
      });
    }
  }
} 