import { Request, Response } from 'express';
import { VerbfyTalkRoom } from '../models/VerbfyTalkRoom';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

export class VerbfyTalkController {
  // Get all available rooms
  static async getRooms(req: Request, res: Response) {
    try {
      const { level, isPrivate, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const filter: any = { isActive: true };
      if (level && level !== 'All') filter.level = level;
      if (isPrivate !== undefined) filter.isPrivate = isPrivate === 'true';

      const rooms = await VerbfyTalkRoom.find(filter)
        .populate('createdBy', 'name email avatar')
        .populate('participants.userId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      // Add active participant count to each room
      const roomsWithActiveCount = rooms.map(room => {
        const activeCount = room.participants.filter((p: any) => p.isActive).length;
        return {
          ...room.toObject(),
          activeParticipantCount: activeCount
        };
      });

      const total = await VerbfyTalkRoom.countDocuments(filter);

      res.json({
        success: true,
        data: roomsWithActiveCount,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
    }
  }

  // Create a new room
  static async createRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { name, description, isPrivate, password, topic, level, maxParticipants } = req.body;

      // Validate max participants
      const maxParticipantsNum = Math.min(Math.max(Number(maxParticipants) || 5, 2), 5);

      const roomData: any = {
        name,
        description,
        createdBy: userId,
        isPrivate,
        topic,
        level: level || 'Mixed',
        maxParticipants: maxParticipantsNum,
        participants: [{ userId, joinedAt: new Date(), isActive: true }]
      };

      if (isPrivate && password) {
        roomData.password = password;
      }

      const room = new VerbfyTalkRoom(roomData);
      await room.save();

      const populatedRoom = await VerbfyTalkRoom.findById(room._id)
        .populate('createdBy', 'name email avatar')
        .populate('participants.userId', 'name email avatar');

      res.status(201).json({
        success: true,
        data: populatedRoom,
        message: 'Room created successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create room' });
    }
  }

  // Join a room
  static async joinRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { roomId } = req.params;
      const { password } = req.body;

      const room = await VerbfyTalkRoom.findById(roomId)
        .populate('createdBy', 'name email avatar')
        .populate('participants.userId', 'name email avatar');

      if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      if (!room.isActive) {
        return res.status(400).json({ success: false, message: 'Room is not active' });
      }

      // Check if room is full
      const activeParticipants = room.participants.filter((p: any) => p.isActive).length;
      if (activeParticipants >= room.maxParticipants) {
        return res.status(400).json({ success: false, message: 'Room is full' });
      }

      // Check password for private rooms
      if (room.isPrivate && room.password) {
        if (!password) {
          return res.status(400).json({ success: false, message: 'Password required for private room' });
        }
        const isValidPassword = await bcrypt.compare(password, room.password);
        if (!isValidPassword) {
          return res.status(400).json({ success: false, message: 'Invalid password' });
        }
      }

      // Check if user is already in the room (active)
      const existingParticipant = room.participants.find((p: any) => 
        p.userId.toString() === userId && p.isActive
      );
      
      if (existingParticipant) {
        return res.status(400).json({ success: false, message: 'Already in room' });
      }

      // Check if user was previously in room but inactive (rejoin)
      const inactiveParticipantIndex = room.participants.findIndex((p: any) => 
        p.userId.toString() === userId && !p.isActive
      );
      
      if (inactiveParticipantIndex !== -1) {
        // Reactivate existing participant - update the existing one instead of creating duplicate
        room.participants[inactiveParticipantIndex].isActive = true;
        room.participants[inactiveParticipantIndex].joinedAt = new Date();
        room.participants[inactiveParticipantIndex].leftAt = undefined;
      } else {
        // Add new participant only if they don't exist at all
        room.participants.push({
          userId,
          joinedAt: new Date(),
          isActive: true
        });
      }

      await room.save();

      const updatedRoom = await VerbfyTalkRoom.findById(roomId)
        .populate('createdBy', 'name email avatar')
        .populate('participants.userId', 'name email avatar');

      res.json({
        success: true,
        data: updatedRoom,
        message: 'Joined room successfully'
      });
    } catch (error) {
      console.error('Error joining room:', error);
      res.status(500).json({ success: false, message: 'Failed to join room' });
    }
  }

  // Leave a room
  static async leaveRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { roomId } = req.params;

      const room = await VerbfyTalkRoom.findById(roomId);
      if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      // Find and deactivate user's participation
      const participantIndex = room.participants.findIndex((p: any) => 
        p.userId.toString() === userId && p.isActive
      );

      if (participantIndex === -1) {
        return res.status(400).json({ success: false, message: 'Not in room' });
      }

      // Mark participant as inactive and set leave time
      room.participants[participantIndex].isActive = false;
      room.participants[participantIndex].leftAt = new Date();

      // If no active participants, end the room
      const activeParticipants = room.participants.filter((p: any) => p.isActive).length;
      if (activeParticipants === 0) {
        room.endedAt = new Date();
        room.isActive = false;
        console.log(`🏁 Room ${room.name} (${roomId}) ended - no active participants`);
      }

      await room.save();

      res.json({
        success: true,
        message: 'Left room successfully'
      });
    } catch (error) {
      console.error('Error leaving room:', error);
      res.status(500).json({ success: false, message: 'Failed to leave room' });
    }
  }

  // Get room details
  static async getRoomDetails(req: Request, res: Response) {
    try {
      const { roomId } = req.params;

      const room = await VerbfyTalkRoom.findById(roomId)
        .populate('createdBy', 'name email avatar')
        .populate('participants.userId', 'name email avatar');

      if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      // Clean up duplicate participants before sending response
      const uniqueParticipants = room.participants.reduce((acc: any[], participant: any) => {
        const existingIndex = acc.findIndex(p => p.userId.toString() === participant.userId.toString());
        if (existingIndex === -1) {
          acc.push(participant);
        } else {
          // If duplicate found, keep the most recent active one
          if (participant.isActive && !acc[existingIndex].isActive) {
            acc[existingIndex] = participant;
          }
        }
        return acc;
      }, []);

      // Update room if duplicates were found
      if (uniqueParticipants.length !== room.participants.length) {
        room.participants = uniqueParticipants;
        await room.save();
        console.log(`🧹 Cleaned up duplicate participants in room ${room.name}`);
      }

      res.json({
        success: true,
        data: room
      });
    } catch (error) {
      console.error('Error getting room details:', error);
      res.status(500).json({ success: false, message: 'Failed to get room details' });
    }
  }

  // Update room (only by creator)
  static async updateRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { roomId } = req.params;
      const { name, description, topic, level, isPrivate, password } = req.body;

      const room = await VerbfyTalkRoom.findById(roomId);
      if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      if (room.createdBy.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      // Update fields
      if (name) room.name = name;
      if (description) room.description = description;
      if (topic) room.topic = topic;
      if (level) room.level = level;
      if (isPrivate !== undefined) room.isPrivate = isPrivate;
      if (password && isPrivate) room.password = password;

      await room.save();

      const updatedRoom = await VerbfyTalkRoom.findById(roomId)
        .populate('createdBy', 'name email avatar')
        .populate('participants.userId', 'name email avatar');

      res.json({
        success: true,
        data: updatedRoom,
        message: 'Room updated successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update room' });
    }
  }

  // Delete room (only by creator)
  static async deleteRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { roomId } = req.params;

      const room = await VerbfyTalkRoom.findById(roomId);
      if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      if (room.createdBy.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      room.isActive = false;
      room.endedAt = new Date();
      await room.save();

      res.json({
        success: true,
        message: 'Room deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete room' });
    }
  }

  // Get user's rooms
  static async getUserRooms(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const rooms = await VerbfyTalkRoom.find({
        'participants.userId': userId
      })
        .populate('createdBy', 'name email avatar')
        .populate('participants.userId', 'name email avatar')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await VerbfyTalkRoom.countDocuments({
        'participants.userId': userId
      });

      res.json({
        success: true,
        data: rooms,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch user rooms' });
    }
  }

  // Leave room
  static async leaveRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { roomId } = req.params;

      const room = await VerbfyTalkRoom.findById(roomId);
      if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      // Remove user from participants
      room.participants = room.participants.filter((p: any) => p.userId.toString() !== userId);
      
      // If no participants left, close the room
      if (room.participants.length === 0) {
        room.isActive = false;
        room.endedAt = new Date();
      }

      await room.save();

      res.json({
        success: true,
        message: 'Left room successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to leave room' });
    }
  }

  // Clean up empty rooms (cron job)
  static async cleanupEmptyRooms() {
    try {
      const emptyRooms = await VerbfyTalkRoom.find({
        isActive: true,
        $expr: { $eq: [{ $size: "$participants" }, 0] }
      });

      for (const room of emptyRooms) {
        room.isActive = false;
        room.endedAt = new Date();
        await room.save();
        console.log(`🧹 Cleaned up empty room: ${room.name} (${room._id})`);
      }

      console.log(`🧹 Cleaned up ${emptyRooms.length} empty rooms`);
    } catch (error) {
      console.error('❌ Failed to cleanup empty rooms:', error);
    }
  }
} 