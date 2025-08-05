import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  organizationId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  
  // Event Information
  event: {
    type: string; // e.g., 'user.login', 'content.create', 'payment.process'
    category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security' | 'financial' | 'compliance';
    action: string; // e.g., 'create', 'update', 'delete', 'view', 'login', 'logout'
    resource: string; // e.g., 'user', 'content', 'lesson', 'payment'
    resourceId?: string; // ID of the affected resource
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // Request Information
  request: {
    method: string; // HTTP method
    url: string;
    ip: string;
    userAgent: string;
    headers: Record<string, string>;
    body?: any; // Request body (sanitized)
    query?: any; // Query parameters
    params?: any; // Route parameters
  };
  
  // Response Information
  response: {
    statusCode: number;
    statusMessage: string;
    responseTime: number; // in milliseconds
    body?: any; // Response body (sanitized)
  };
  
  // Context Information
  context: {
    timestamp: Date;
    timezone: string;
    environment: string; // 'development', 'staging', 'production'
    version: string; // API version
    correlationId?: string; // For tracing requests across services
    requestId?: string; // Unique request identifier
  };
  
  // User Context
  userContext: {
    roles: string[];
    permissions: string[];
    isAuthenticated: boolean;
    authenticationMethod?: string; // 'jwt', 'oauth', 'saml', 'api_key'
    sessionDuration?: number; // in seconds
  };
  
  // Data Changes
  changes?: {
    before?: any; // Previous state
    after?: any; // New state
    fields: string[]; // Fields that were changed
  };
  
  // Error Information
  error?: {
    message: string;
    code: string;
    stack?: string;
    details?: any;
  };
  
  // Compliance & Legal
  compliance: {
    gdprRelevant: boolean;
    dataSubject?: string; // For GDPR compliance
    legalBasis?: string; // Legal basis for data processing
    retentionPeriod: number; // Days to retain this log
  };
  
  // Metadata
  metadata: {
    tags: string[];
    customFields: Record<string, any>;
    priority: number; // 1-10, higher = more important
    isRetained: boolean; // Whether this log should be retained
  };
  
  createdAt: Date;
  
  // Methods
  sanitizeSensitiveData(): void;
}

const AuditLogSchema = new Schema<IAuditLog>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  event: {
    type: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ['authentication', 'authorization', 'data_access', 'data_modification', 'system', 'security', 'financial', 'compliance'],
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    resource: {
      type: String,
      required: true,
      index: true
    },
    resourceId: {
      type: String,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true
    }
  },
  request: {
    method: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    ip: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    headers: {
      type: Schema.Types.Mixed,
      default: {}
    },
    body: {
      type: Schema.Types.Mixed
    },
    query: {
      type: Schema.Types.Mixed
    },
    params: {
      type: Schema.Types.Mixed
    }
  },
  response: {
    statusCode: {
      type: Number,
      required: true
    },
    statusMessage: {
      type: String,
      required: true
    },
    responseTime: {
      type: Number,
      required: true,
      min: 0
    },
    body: {
      type: Schema.Types.Mixed
    }
  },
  context: {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development'
    },
    version: {
      type: String,
      default: '1.0.0'
    },
    correlationId: {
      type: String,
      index: true
    },
    requestId: {
      type: String,
      index: true
    }
  },
  userContext: {
    roles: [{
      type: String
    }],
    permissions: [{
      type: String
    }],
    isAuthenticated: {
      type: Boolean,
      default: false
    },
    authenticationMethod: {
      type: String,
      enum: ['jwt', 'oauth', 'saml', 'api_key']
    },
    sessionDuration: {
      type: Number,
      min: 0
    }
  },
  changes: {
    before: {
      type: Schema.Types.Mixed
    },
    after: {
      type: Schema.Types.Mixed
    },
    fields: [{
      type: String
    }]
  },
  error: {
    message: {
      type: String
    },
    code: {
      type: String
    },
    stack: {
      type: String
    },
    details: {
      type: Schema.Types.Mixed
    }
  },
  compliance: {
    gdprRelevant: {
      type: Boolean,
      default: false
    },
    dataSubject: {
      type: String
    },
    legalBasis: {
      type: String
    },
    retentionPeriod: {
      type: Number,
      default: 2555, // 7 years
      min: 30
    }
  },
  metadata: {
    tags: [{
      type: String
    }],
    customFields: {
      type: Schema.Types.Mixed,
      default: {}
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    isRetained: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for efficient querying
AuditLogSchema.index({ 'event.category': 1, 'event.severity': 1 });
AuditLogSchema.index({ 'context.timestamp': -1 });
AuditLogSchema.index({ 'event.resource': 1, 'event.resourceId': 1 });
AuditLogSchema.index({ 'request.ip': 1 });
AuditLogSchema.index({ 'compliance.gdprRelevant': 1 });
AuditLogSchema.index({ 'metadata.priority': -1 });

// TTL index for automatic cleanup based on retention period
AuditLogSchema.index({ 'context.timestamp': 1 }, { 
  expireAfterSeconds: 0,
  partialFilterExpression: { 'metadata.isRetained': false }
});

// Virtual for formatted timestamp
AuditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.context.timestamp.toISOString();
});

// Virtual for event summary
AuditLogSchema.virtual('eventSummary').get(function() {
  return `${this.event.action} ${this.event.resource}${this.event.resourceId ? ` (${this.event.resourceId})` : ''}`;
});

// Method to check if log should be retained
AuditLogSchema.methods.shouldRetain = function(): boolean {
  const retentionDate = new Date(this.context.timestamp);
  retentionDate.setDate(retentionDate.getDate() + this.compliance.retentionPeriod);
  
  return retentionDate > new Date() && this.metadata.isRetained;
};

// Method to sanitize sensitive data
AuditLogSchema.methods.sanitizeSensitiveData = function(): void {
  // Remove sensitive headers
  if (this.request.headers) {
    delete this.request.headers.authorization;
    delete this.request.headers.cookie;
    delete this.request.headers['x-api-key'];
  }
  
  // Remove sensitive body fields
  if (this.request.body) {
    delete this.request.body.password;
    delete this.request.body.token;
    delete this.request.body.secret;
  }
  
  // Remove sensitive response data
  if (this.response.body) {
    delete this.response.body.token;
    delete this.response.body.secret;
  }
};

// Static method to create audit log
AuditLogSchema.statics.createLog = async function(data: Partial<IAuditLog>): Promise<IAuditLog> {
  const log = new this(data);
  
  // Sanitize sensitive data
  log.sanitizeSensitiveData();
  
  // Set default values
  if (!log.context.timestamp) {
    log.context.timestamp = new Date();
  }
  
  if (!log.context.timezone) {
    log.context.timezone = 'UTC';
  }
  
  // Set GDPR relevance based on event type
  const gdprRelevantEvents = [
    'user.create', 'user.update', 'user.delete',
    'data.export', 'data.access', 'data.modify',
    'consent.grant', 'consent.withdraw'
  ];
  
  log.compliance.gdprRelevant = gdprRelevantEvents.includes(log.event.type);
  
  return await log.save();
};

// Static method to get logs with filters
AuditLogSchema.statics.getLogs = async function(filters: any = {}, options: any = {}) {
  const {
    organizationId,
    userId,
    eventType,
    category,
    severity,
    resource,
    resourceId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
    sortBy = 'context.timestamp',
    sortOrder = 'desc'
  } = filters;
  
  const query: any = {};
  
  if (organizationId) query.organizationId = organizationId;
  if (userId) query.userId = userId;
  if (eventType) query['event.type'] = eventType;
  if (category) query['event.category'] = category;
  if (severity) query['event.severity'] = severity;
  if (resource) query['event.resource'] = resource;
  if (resourceId) query['event.resourceId'] = resourceId;
  
  if (startDate || endDate) {
    query['context.timestamp'] = {};
    if (startDate) query['context.timestamp'].$gte = new Date(startDate);
    if (endDate) query['context.timestamp'].$lte = new Date(endDate);
  }
  
  const skip = (page - 1) * limit;
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const logs = await this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email')
    .populate('organizationId', 'name slug');
  
  const total = await this.countDocuments(query);
  
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get audit statistics
AuditLogSchema.statics.getStatistics = async function(organizationId: string, timeRange: string = '30d') {
  const startDate = new Date();
  
  switch (timeRange) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }
  
  const query = {
    organizationId,
    'context.timestamp': { $gte: startDate }
  };
  
  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalLogs: { $sum: 1 },
        errorLogs: {
          $sum: { $cond: [{ $ne: ['$error', null] }, 1, 0] }
        },
        criticalLogs: {
          $sum: { $cond: [{ $eq: ['$event.severity', 'critical'] }, 1, 0] }
        },
        highSeverityLogs: {
          $sum: { $cond: [{ $eq: ['$event.severity', 'high'] }, 1, 0] }
        },
        avgResponseTime: { $avg: '$response.responseTime' },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueIPs: { $addToSet: '$request.ip' }
      }
    },
    {
      $project: {
        totalLogs: 1,
        errorLogs: 1,
        criticalLogs: 1,
        highSeverityLogs: 1,
        avgResponseTime: { $round: ['$avgResponseTime', 2] },
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueIPs: { $size: '$uniqueIPs' }
      }
    }
  ]);
  
  return stats[0] || {
    totalLogs: 0,
    errorLogs: 0,
    criticalLogs: 0,
    highSeverityLogs: 0,
    avgResponseTime: 0,
    uniqueUsers: 0,
    uniqueIPs: 0
  };
};

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema); 