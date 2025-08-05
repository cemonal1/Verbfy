import mongoose, { Document, Schema } from 'mongoose';

export interface IAdvancedAnalytics extends Document {
  organizationId?: mongoose.Types.ObjectId;
  analyticsType: 'user' | 'content' | 'performance' | 'engagement' | 'revenue' | 'predictive';
  timeRange: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  metrics: {
    [key: string]: number | string | boolean | object;
  };
  insights: Array<{
    type: 'trend' | 'anomaly' | 'prediction' | 'recommendation' | 'alert';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // 0-100
    data: any;
    createdAt: Date;
  }>;
  predictions: Array<{
    metric: string;
    currentValue: number;
    predictedValue: number;
    confidence: number;
    timeframe: string;
    factors: string[];
    createdAt: Date;
  }>;
  alerts: Array<{
    type: 'threshold' | 'trend' | 'anomaly' | 'system';
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    isActive: boolean;
    triggeredAt: Date;
    resolvedAt?: Date;
    actionRequired: boolean;
    actionTaken?: string;
  }>;
  realTimeData: {
    activeUsers: number;
    currentSessions: number;
    systemLoad: number;
    responseTime: number;
    errorRate: number;
    lastUpdated: Date;
  };
  customReports: Array<{
    name: string;
    description: string;
    query: string;
    parameters: object;
    schedule?: string; // cron expression
    recipients: string[];
    lastGenerated: Date;
    nextGeneration: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AdvancedAnalyticsSchema = new Schema<IAdvancedAnalytics>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  analyticsType: {
    type: String,
    enum: ['user', 'content', 'performance', 'engagement', 'revenue', 'predictive'],
    required: true
  },
  timeRange: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  metrics: {
    type: Schema.Types.Mixed,
    default: {}
  },
  insights: [{
    type: {
      type: String,
      enum: ['trend', 'anomaly', 'prediction', 'recommendation', 'alert'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    data: {
      type: Schema.Types.Mixed
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  predictions: [{
    metric: {
      type: String,
      required: true
    },
    currentValue: {
      type: Number,
      required: true
    },
    predictedValue: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    timeframe: {
      type: String,
      required: true
    },
    factors: [{
      type: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['threshold', 'trend', 'anomaly', 'system'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    triggeredAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: {
      type: Date
    },
    actionRequired: {
      type: Boolean,
      default: false
    },
    actionTaken: {
      type: String
    }
  }],
  realTimeData: {
    activeUsers: {
      type: Number,
      default: 0,
      min: 0
    },
    currentSessions: {
      type: Number,
      default: 0,
      min: 0
    },
    systemLoad: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    responseTime: {
      type: Number,
      default: 0,
      min: 0
    },
    errorRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  customReports: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    query: {
      type: String,
      required: true
    },
    parameters: {
      type: Schema.Types.Mixed,
      default: {}
    },
    schedule: {
      type: String
    },
    recipients: [{
      type: String
    }],
    lastGenerated: {
      type: Date
    },
    nextGeneration: {
      type: Date
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
AdvancedAnalyticsSchema.index({ organizationId: 1, analyticsType: 1 });
AdvancedAnalyticsSchema.index({ timeRange: 1, startDate: 1, endDate: 1 });
AdvancedAnalyticsSchema.index({ 'alerts.isActive': 1, 'alerts.severity': 1 });
AdvancedAnalyticsSchema.index({ 'insights.type': 1, 'insights.severity': 1 });

// Virtual for active alerts count
AdvancedAnalyticsSchema.virtual('activeAlertsCount').get(function() {
  return this.alerts.filter(alert => alert.isActive).length;
});

// Virtual for critical alerts count
AdvancedAnalyticsSchema.virtual('criticalAlertsCount').get(function() {
  return this.alerts.filter(alert => alert.isActive && alert.severity === 'critical').length;
});

// Method to add insight
AdvancedAnalyticsSchema.methods.addInsight = function(type: string, title: string, description: string, severity: string, data?: any) {
  this.insights.push({
    type: type as any,
    title,
    description,
    severity: severity as any,
    confidence: 70,
    data,
    createdAt: new Date()
  });
};

// Method to add prediction
AdvancedAnalyticsSchema.methods.addPrediction = function(metric: string, currentValue: number, predictedValue: number, confidence: number, timeframe: string, factors: string[]) {
  this.predictions.push({
    metric,
    currentValue,
    predictedValue,
    confidence,
    timeframe,
    factors,
    createdAt: new Date()
  });
};

// Method to add alert
AdvancedAnalyticsSchema.methods.addAlert = function(type: string, title: string, message: string, severity: string, actionRequired: boolean = false) {
  this.alerts.push({
    type: type as any,
    title,
    message,
    severity: severity as any,
    isActive: true,
    triggeredAt: new Date(),
    actionRequired
  });
};

// Method to resolve alert
AdvancedAnalyticsSchema.methods.resolveAlert = function(alertId: string, actionTaken?: string) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.isActive = false;
    alert.resolvedAt = new Date();
    if (actionTaken) {
      alert.actionTaken = actionTaken;
    }
  }
};

export default mongoose.model<IAdvancedAnalytics>('AdvancedAnalytics', AdvancedAnalyticsSchema); 