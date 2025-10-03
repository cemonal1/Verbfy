import { Request, Response } from 'express';
import { Conversation, IConversation } from '../models/Conversation';
import { Message, IMessage } from '../models/Message';
import User from '../models/User';

// Get all conversations for the current user
export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Admins cannot participate in conversations
    if (userRole === 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admins cannot participate in conversations'
      });
      return;
    }

    // Find conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'name email role profileImage')
    .populate('lastMessage.sender', 'name')
    .sort({ updatedAt: -1 });

    // Format conversations to include other participant info
    const formattedConversations = conversations.map(conversation => {
      const otherParticipant = conversation.participants.find(
        (participant: any) => participant._id.toString() !== userId
      ) as any;

      if (!otherParticipant) {
        return null; // Skip conversations without valid other participant
      }

      return {
        _id: conversation._id,
        otherParticipant: {
          _id: otherParticipant._id,
          name: otherParticipant.name,
          email: otherParticipant.email,
          role: otherParticipant.role,
          avatar: otherParticipant.profileImage
        },
        lastMessage: conversation.lastMessage,
        unreadCount: 0, // Will be calculated separately if needed
        updatedAt: conversation.updatedAt,
        createdAt: conversation.createdAt
      };
    }).filter(Boolean); // Remove null entries

    res.json({
      success: true,
      data: formattedConversations,
      message: 'Conversations retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations'
    });
  }
};

// Get or create a conversation between two users
export const getOrCreateConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { otherUserId } = req.params;

    // Admins cannot participate in conversations
    if (userRole === 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admins cannot participate in conversations'
      });
      return;
    }

    // Validate other user exists and has valid role
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Ensure users can only chat with opposite roles (student-teacher)
    if (userRole === otherUser.role) {
      res.status(403).json({
        success: false,
        message: 'Users can only chat with opposite roles'
      });
      return;
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
      isActive: true
    }).populate('participants', 'name email role profileImage');

    // Create new conversation if it doesn't exist
    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, otherUserId]
      });
      await conversation.save();
      
      // Populate participants after saving
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email role profileImage');
    }

    // Format response
    if (!conversation) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversation'
      });
      return;
    }

    const otherParticipant = conversation.participants.find(
      (participant: any) => participant._id.toString() !== userId
    ) as any;

    if (!otherParticipant) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversation participant'
      });
      return;
    }

    const formattedConversation = {
      _id: conversation._id,
      otherParticipant: {
        _id: otherParticipant._id,
        name: otherParticipant.name,
        email: otherParticipant.email,
        role: otherParticipant.role,
        avatar: otherParticipant.profileImage
      },
      lastMessage: conversation.lastMessage,
      updatedAt: conversation.updatedAt,
      createdAt: conversation.createdAt
    };

    res.json({
      success: true,
      data: formattedConversation,
      message: 'Conversation retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation'
    });
  }
};

// Get messages for a conversation
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Admins cannot access conversations
    if (userRole === 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admins cannot access conversations'
      });
      return;
    }

    // Verify user is a participant in the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found or access denied'
      });
      return;
    }

    // Get messages with pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name email role profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Message.countDocuments({ conversationId });

    // Mark messages as read for the current user
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      },
      message: 'Messages retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages'
    });
  }
};

// Send a message
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { conversationId, content, messageType = 'text' } = req.body;

    // Admins cannot send messages
    if (userRole === 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admins cannot send messages'
      });
      return;
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
      return;
    }

    if (content.length > 1000) {
      res.status(400).json({
        success: false,
        message: 'Message content cannot exceed 1000 characters'
      });
      return;
    }

    // Verify user is a participant in the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found or access denied'
      });
      return;
    }

    // Create new message
    const message = new Message({
      conversationId,
      sender: userId,
      content: content.trim(),
      messageType
    });

    await message.save();

    // Update conversation's last message
    conversation.lastMessage = {
      content: content.trim(),
      sender: userId,
      timestamp: new Date()
    };
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender details
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role profileImage');

    res.status(201).json({
      success: true,
      data: populatedMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Mark messages as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { conversationId } = req.params;

    // Verify user is a participant in the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found or access denied'
      });
      return;
    }

    // Mark all unread messages as read
    const result = await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      data: { updatedCount: result.modifiedCount },
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

// Get unread message count
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const unreadCount = await Message.countDocuments({
      sender: { $ne: userId },
      isRead: false,
      conversationId: {
        $in: await Conversation.find({ participants: userId }).distinct('_id')
      }
    });

    res.json({
      success: true,
      data: { unreadCount },
      message: 'Unread count retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};