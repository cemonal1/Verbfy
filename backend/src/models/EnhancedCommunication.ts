import mongoose, { Document, Schema } from 'mongoose';

export interface IEnhancedCommunication extends Document {
  roomId: string;
  roomType: 'lesson' | 'group' | 'meeting' | 'presentation' | 'workshop';
  title: string;
  description?: string;
  hostId: mongoose.Types.ObjectId;
  participants: Array<{
    userId: mongoose.Types.ObjectId;
    role: 'host' | 'co-host' | 'participant' | 'observer';
    joinedAt: Date;
    leftAt?: Date;
    isActive: boolean;
    permissions: {
      canShareScreen: boolean;
      canRecord: boolean;
      canChat: boolean;
      canPresent: boolean;
      canManageParticipants: boolean;
    };
  }>;
  settings: {
    maxParticipants: number;
    allowScreenSharing: boolean;
    allowRecording: boolean;
    allowChat: boolean;
    allowBreakoutRooms: boolean;
    autoRecord: boolean;
    waitingRoom: boolean;
    muteOnEntry: boolean;
    videoOnEntry: boolean;
  };
  breakoutRooms: Array<{
    roomId: string;
    name: string;
    participants: mongoose.Types.ObjectId[];
    hostId: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
  }>;
  recordings: Array<{
    recordingId: string;
    fileName: string;
    fileSize: number;
    duration: number;
    startTime: Date;
    endTime: Date;
    recordedBy: mongoose.Types.ObjectId;
    downloadUrl: string;
    isPublic: boolean;
  }>;
  whiteboard: {
    isActive: boolean;
    currentPresenter?: mongoose.Types.ObjectId;
    snapshots: Array<{
      snapshotId: string;
      data: any;
      createdBy: mongoose.Types.ObjectId;
      createdAt: Date;
    }>;
  };
  chat: {
    messages: Array<{
      messageId: string;
      senderId: mongoose.Types.ObjectId;
      content: string;
      type: 'text' | 'file' | 'image' | 'system';
      timestamp: Date;
      isPrivate: boolean;
      recipientId?: mongoose.Types.ObjectId;
      attachments?: Array<{
        fileName: string;
        fileSize: number;
        fileType: string;
        downloadUrl: string;
      }>;
    }>;
    isEnabled: boolean;
    allowPrivateMessages: boolean;
  };
  polls: Array<{
    pollId: string;
    question: string;
    options: string[];
    isMultipleChoice: boolean;
    isAnonymous: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    endTime?: Date;
    isActive: boolean;
    responses: Array<{
      participantId: mongoose.Types.ObjectId;
      selectedOptions: number[];
      timestamp: Date;
    }>;
  }>;
  status: 'scheduled' | 'active' | 'paused' | 'ended' | 'cancelled';
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EnhancedCommunicationSchema = new Schema<IEnhancedCommunication>({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  roomType: {
    type: String,
    enum: ['lesson', 'group', 'meeting', 'presentation', 'workshop'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  hostId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['host', 'co-host', 'participant', 'observer'],
      default: 'participant'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    permissions: {
      canShareScreen: {
        type: Boolean,
        default: true
      },
      canRecord: {
        type: Boolean,
        default: false
      },
      canChat: {
        type: Boolean,
        default: true
      },
      canPresent: {
        type: Boolean,
        default: true
      },
      canManageParticipants: {
        type: Boolean,
        default: false
      }
    }
  }],
  settings: {
    maxParticipants: {
      type: Number,
      default: 50,
      min: 1,
      max: 1000
    },
    allowScreenSharing: {
      type: Boolean,
      default: true
    },
    allowRecording: {
      type: Boolean,
      default: true
    },
    allowChat: {
      type: Boolean,
      default: true
    },
    allowBreakoutRooms: {
      type: Boolean,
      default: false
    },
    autoRecord: {
      type: Boolean,
      default: false
    },
    waitingRoom: {
      type: Boolean,
      default: true
    },
    muteOnEntry: {
      type: Boolean,
      default: true
    },
    videoOnEntry: {
      type: Boolean,
      default: false
    }
  },
  breakoutRooms: [{
    roomId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  recordings: [{
    recordingId: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    downloadUrl: {
      type: String,
      required: true
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  }],
  whiteboard: {
    isActive: {
      type: Boolean,
      default: false
    },
    currentPresenter: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    snapshots: [{
      snapshotId: {
        type: String,
        required: true
      },
      data: {
        type: Schema.Types.Mixed
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  chat: {
    messages: [{
      messageId: {
        type: String,
        required: true
      },
      senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['text', 'file', 'image', 'system'],
        default: 'text'
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      isPrivate: {
        type: Boolean,
        default: false
      },
      recipientId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      attachments: [{
        fileName: {
          type: String,
          required: true
        },
        fileSize: {
          type: Number,
          required: true
        },
        fileType: {
          type: String,
          required: true
        },
        downloadUrl: {
          type: String,
          required: true
        }
      }]
    }],
    isEnabled: {
      type: Boolean,
      default: true
    },
    allowPrivateMessages: {
      type: Boolean,
      default: true
    }
  },
  polls: [{
    pollId: {
      type: String,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    options: [{
      type: String,
      required: true
    }],
    isMultipleChoice: {
      type: Boolean,
      default: false
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    responses: [{
      participantId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      selectedOptions: [{
        type: Number,
        required: true
      }],
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  status: {
    type: String,
    enum: ['scheduled', 'active', 'paused', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  scheduledStart: {
    type: Date,
    required: true
  },
  scheduledEnd: {
    type: Date,
    required: true
  },
  actualStart: {
    type: Date
  },
  actualEnd: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
EnhancedCommunicationSchema.index({ roomId: 1 });
EnhancedCommunicationSchema.index({ hostId: 1, status: 1 });
EnhancedCommunicationSchema.index({ 'participants.userId': 1 });
EnhancedCommunicationSchema.index({ scheduledStart: 1, status: 1 });
EnhancedCommunicationSchema.index({ roomType: 1, status: 1 });

// Virtual for active participants count
EnhancedCommunicationSchema.virtual('activeParticipantsCount').get(function() {
  return this.participants.filter(p => p.isActive).length;
});

// Virtual for session duration
EnhancedCommunicationSchema.virtual('sessionDuration').get(function() {
  if (!this.actualStart) return 0;
  const endTime = this.actualEnd || new Date();
  return Math.floor((endTime.getTime() - this.actualStart.getTime()) / (1000 * 60));
});

// Method to add participant
EnhancedCommunicationSchema.methods.addParticipant = function(userId: string, role: string = 'participant') {
  const existingParticipant = this.participants.find((p: any) => p.userId.toString() === userId);
  if (!existingParticipant) {
    this.participants.push({
      userId: new mongoose.Types.ObjectId(userId),
      role: role as any,
      joinedAt: new Date(),
      isActive: true,
      permissions: {
        canShareScreen: role === 'host' || role === 'co-host',
        canRecord: role === 'host',
        canChat: true,
        canPresent: true,
        canManageParticipants: role === 'host' || role === 'co-host'
      }
    });
  } else {
    existingParticipant.isActive = true;
    existingParticipant.leftAt = undefined;
  }
};

// Method to remove participant
EnhancedCommunicationSchema.methods.removeParticipant = function(userId: string) {
  const participant = this.participants.find((p: any) => p.userId.toString() === userId);
  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
  }
};

// Method to add message
EnhancedCommunicationSchema.methods.addMessage = function(senderId: string, content: string, type: string = 'text', isPrivate: boolean = false, recipientId?: string) {
  this.chat.messages.push({
    messageId: new mongoose.Types.ObjectId().toString(),
    senderId: new mongoose.Types.ObjectId(senderId),
    content,
    type: type as any,
    timestamp: new Date(),
    isPrivate,
    recipientId: recipientId ? new mongoose.Types.ObjectId(recipientId) : undefined
  });
};

// Method to create poll
EnhancedCommunicationSchema.methods.createPoll = function(question: string, options: string[], createdBy: string, isMultipleChoice: boolean = false, isAnonymous: boolean = false) {
  this.polls.push({
    pollId: new mongoose.Types.ObjectId().toString(),
    question,
    options,
    isMultipleChoice,
    isAnonymous,
    createdBy: new mongoose.Types.ObjectId(createdBy),
    createdAt: new Date(),
    isActive: true,
    responses: []
  });
};

export default mongoose.model<IEnhancedCommunication>('EnhancedCommunication', EnhancedCommunicationSchema); 