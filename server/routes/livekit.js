const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { generateLessonToken, generateTalkToken } = require('../utils/livekitToken');
const Reservation = require('../models/Reservation');
const Lesson = require('../models/Lesson');

const router = express.Router();

// @route   GET /api/livekit/token
// @desc    Generate LiveKit token for room access
// @access  Private
router.get('/token', authMiddleware, async (req, res) => {
  try {
    const { roomName, role, roomType, reservationId } = req.query;

    // Validate required parameters
    if (!roomName || !roomType) {
      return res.status(400).json({
        success: false,
        message: 'roomName and roomType are required.'
      });
    }

    let token;

    if (roomType === 'lesson') {
      // Validate reservation access for lesson rooms
      if (!reservationId) {
        return res.status(400).json({
          success: false,
          message: 'reservationId is required for lesson rooms.'
        });
      }

      const reservation = await Reservation.findById(reservationId);
      
      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found.'
        });
      }

      // Check if user is involved in the reservation
      const isStudent = reservation.studentId.toString() === req.user._id.toString();
      const isTeacher = reservation.teacherId.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isStudent && !isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not involved in this reservation.'
        });
      }

      // Check if lesson is currently active
      const now = new Date();
      const isActive = now >= reservation.datetimeStart && now <= reservation.datetimeEnd;
      
      if (!isActive && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Lesson is not currently active.'
        });
      }

      // Generate lesson token
      const userRole = req.user.role;
      token = generateLessonToken(
        req.user._id.toString(),
        req.user.username,
        userRole,
        reservationId
      );

      // Create or update lesson record
      let lesson = await Lesson.findOne({ reservationId });
      
      if (!lesson) {
        lesson = new Lesson({
          reservationId,
          livekitRoom: {
            roomId: `lesson-${reservationId}`,
            roomName: roomName,
            isActive: true,
            startedAt: new Date()
          },
          status: 'in-progress'
        });
      } else {
        lesson.livekitRoom.isActive = true;
        if (!lesson.livekitRoom.startedAt) {
          lesson.livekitRoom.startedAt = new Date();
        }
        lesson.status = 'in-progress';
      }

      await lesson.save();

    } else if (roomType === 'talk') {
      // Generate talk token
      token = generateTalkToken(
        req.user._id.toString(),
        req.user.username,
        roomName
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid roomType. Must be "lesson" or "talk".'
      });
    }

    res.json({
      success: true,
      data: {
        token,
        roomName,
        roomType
      }
    });
  } catch (error) {
    console.error('LiveKit token generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating token.'
    });
  }
});

// @route   POST /api/livekit/room/end
// @desc    End a lesson room
// @access  Private
router.post('/room/end', authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: 'reservationId is required.'
      });
    }

    // Find the lesson
    const lesson = await Lesson.findOne({ reservationId });
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found.'
      });
    }

    // Check if user has permission to end the lesson
    const reservation = await Reservation.findById(reservationId);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found.'
      });
    }

    const isTeacher = reservation.teacherId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers can end lessons.'
      });
    }

    // End the lesson
    lesson.status = 'completed';
    lesson.livekitRoom.isActive = false;
    lesson.livekitRoom.endedAt = new Date();
    
    if (lesson.livekitRoom.startedAt) {
      lesson.metrics.duration = Math.round(
        (lesson.livekitRoom.endedAt - lesson.livekitRoom.startedAt) / (1000 * 60)
      );
    }

    await lesson.save();

    res.json({
      success: true,
      message: 'Lesson ended successfully.',
      data: {
        lesson: lesson
      }
    });
  } catch (error) {
    console.error('End lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while ending lesson.'
    });
  }
});

// @route   GET /api/livekit/room/:reservationId/participants
// @desc    Get participants in a lesson room
// @access  Private
router.get('/room/:reservationId/participants', authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;

    // Check reservation access
    const reservation = await Reservation.findById(reservationId);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found.'
      });
    }

    const isStudent = reservation.studentId.toString() === req.user._id.toString();
    const isTeacher = reservation.teacherId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isStudent && !isTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not involved in this reservation.'
      });
    }

    // Get lesson participants
    const lesson = await Lesson.findOne({ reservationId });
    
    if (!lesson) {
      return res.json({
        success: true,
        data: {
          participants: []
        }
      });
    }

    res.json({
      success: true,
      data: {
        participants: lesson.livekitRoom.participants || []
      }
    });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching participants.'
    });
  }
});

module.exports = router; 