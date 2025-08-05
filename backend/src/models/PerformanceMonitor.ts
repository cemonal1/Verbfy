import mongoose, { Document, Schema } from 'mongoose';

export interface IPerformanceMonitor extends Document {
  organizationId?: mongoose.Types.ObjectId;
  
  // System Metrics
  system: {
    cpu: {
      usage: number; // percentage
      load: number; // system load average
      cores: number;
      temperature?: number;
    };
    memory: {
      total: number; // in GB
      used: number; // in GB
      available: number; // in GB
      usage: number; // percentage
      swap: {
        total: number;
        used: number;
        usage: number;
      };
    };
    disk: {
      total: number; // in GB
      used: number; // in GB
      available: number; // in GB
      usage: number; // percentage
      io: {
        read: number; // MB/s
        write: number; // MB/s
        iops: number; // operations per second
      };
    };
    network: {
      bytesIn: number; // bytes received
      bytesOut: number; // bytes sent
      packetsIn: number;
      packetsOut: number;
      errors: number;
      dropped: number;
    };
  };
  
  // Application Metrics
  application: {
    uptime: number; // in seconds
    version: string;
    environment: string;
    processId: number;
    memoryUsage: {
      rss: number; // Resident Set Size in bytes
      heapTotal: number; // Total heap size in bytes
      heapUsed: number; // Used heap size in bytes
      external: number; // External memory in bytes
    };
    eventLoop: {
      lag: number; // in milliseconds
      utilization: number; // percentage
    };
    garbageCollection: {
      collections: number;
      duration: number; // in milliseconds
      memoryFreed: number; // in bytes
    };
  };
  
  // Database Metrics
  database: {
    connections: {
      current: number;
      available: number;
      max: number;
      pending: number;
    };
    operations: {
      queries: number;
      inserts: number;
      updates: number;
      deletes: number;
      commands: number;
    };
    performance: {
      avgQueryTime: number; // in milliseconds
      slowQueries: number; // queries > 100ms
      indexHits: number;
      indexMisses: number;
      cacheHitRatio: number; // percentage
    };
    storage: {
      size: number; // in bytes
      dataSize: number; // in bytes
      indexSize: number; // in bytes
      collections: number;
    };
  };
  
  // API Performance
  api: {
    requests: {
      total: number;
      successful: number;
      failed: number;
      rate: number; // requests per second
    };
    response: {
      avgTime: number; // in milliseconds
      p50: number; // 50th percentile
      p95: number; // 95th percentile
      p99: number; // 99th percentile
      maxTime: number;
    };
    errors: {
      total: number;
      rate: number; // errors per second
      byType: Record<string, number>;
      byEndpoint: Record<string, number>;
    };
    endpoints: Array<{
      path: string;
      method: string;
      requests: number;
      avgTime: number;
      errors: number;
      lastUsed: Date;
    }>;
  };
  
  // Cache Performance
  cache: {
    redis: {
      connected: boolean;
      memory: {
        used: number; // in bytes
        peak: number; // in bytes
        fragmentation: number; // percentage
      };
      operations: {
        hits: number;
        misses: number;
        hitRate: number; // percentage
        commands: number;
        keyspace: number;
      };
      clients: {
        connected: number;
        blocked: number;
      };
    };
    memory: {
      size: number; // in bytes
      keys: number;
      hits: number;
      misses: number;
      hitRate: number; // percentage
    };
  };
  
  // External Services
  externalServices: {
    livekit: {
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number; // in milliseconds
      errors: number;
      rooms: number;
      participants: number;
    };
    stripe: {
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number;
      errors: number;
      requests: number;
    };
    openai: {
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number;
      errors: number;
      tokens: number;
      cost: number;
    };
  };
  
  // Business Metrics
  business: {
    users: {
      total: number;
      active: number;
      new: number; // new users in this period
      churn: number; // churned users in this period
    };
    content: {
      total: number;
      created: number; // new content in this period
      accessed: number; // content accesses in this period
    };
    lessons: {
      total: number;
      completed: number; // completed in this period
      inProgress: number;
    };
    revenue: {
      total: number;
      thisPeriod: number;
      growth: number; // percentage
    };
  };
  
  // Alerts & Thresholds
  alerts: Array<{
    type: 'cpu' | 'memory' | 'disk' | 'database' | 'api' | 'cache' | 'service';
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: Date;
    isActive: boolean;
  }>;
  
  // Health Status
  health: {
    overall: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warn';
      responseTime: number;
      message?: string;
      timestamp: Date;
    }>;
    score: number; // 0-100, overall health score
  };
  
  // Metadata
  timestamp: Date;
  interval: number; // monitoring interval in seconds
  version: string; // monitoring system version
}

const PerformanceMonitorSchema = new Schema<IPerformanceMonitor>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  system: {
    cpu: {
      usage: { type: Number, min: 0, max: 100 },
      load: { type: Number, min: 0 },
      cores: { type: Number, min: 1 },
      temperature: { type: Number, min: 0 }
    },
    memory: {
      total: { type: Number, min: 0 },
      used: { type: Number, min: 0 },
      available: { type: Number, min: 0 },
      usage: { type: Number, min: 0, max: 100 },
      swap: {
        total: { type: Number, min: 0 },
        used: { type: Number, min: 0 },
        usage: { type: Number, min: 0, max: 100 }
      }
    },
    disk: {
      total: { type: Number, min: 0 },
      used: { type: Number, min: 0 },
      available: { type: Number, min: 0 },
      usage: { type: Number, min: 0, max: 100 },
      io: {
        read: { type: Number, min: 0 },
        write: { type: Number, min: 0 },
        iops: { type: Number, min: 0 }
      }
    },
    network: {
      bytesIn: { type: Number, min: 0 },
      bytesOut: { type: Number, min: 0 },
      packetsIn: { type: Number, min: 0 },
      packetsOut: { type: Number, min: 0 },
      errors: { type: Number, min: 0 },
      dropped: { type: Number, min: 0 }
    }
  },
  application: {
    uptime: { type: Number, min: 0 },
    version: { type: String, required: true },
    environment: { type: String, required: true },
    processId: { type: Number, required: true },
    memoryUsage: {
      rss: { type: Number, min: 0 },
      heapTotal: { type: Number, min: 0 },
      heapUsed: { type: Number, min: 0 },
      external: { type: Number, min: 0 }
    },
    eventLoop: {
      lag: { type: Number, min: 0 },
      utilization: { type: Number, min: 0, max: 100 }
    },
    garbageCollection: {
      collections: { type: Number, min: 0 },
      duration: { type: Number, min: 0 },
      memoryFreed: { type: Number, min: 0 }
    }
  },
  database: {
    connections: {
      current: { type: Number, min: 0 },
      available: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      pending: { type: Number, min: 0 }
    },
    operations: {
      queries: { type: Number, min: 0 },
      inserts: { type: Number, min: 0 },
      updates: { type: Number, min: 0 },
      deletes: { type: Number, min: 0 },
      commands: { type: Number, min: 0 }
    },
    performance: {
      avgQueryTime: { type: Number, min: 0 },
      slowQueries: { type: Number, min: 0 },
      indexHits: { type: Number, min: 0 },
      indexMisses: { type: Number, min: 0 },
      cacheHitRatio: { type: Number, min: 0, max: 100 }
    },
    storage: {
      size: { type: Number, min: 0 },
      dataSize: { type: Number, min: 0 },
      indexSize: { type: Number, min: 0 },
      collections: { type: Number, min: 0 }
    }
  },
  api: {
    requests: {
      total: { type: Number, min: 0 },
      successful: { type: Number, min: 0 },
      failed: { type: Number, min: 0 },
      rate: { type: Number, min: 0 }
    },
    response: {
      avgTime: { type: Number, min: 0 },
      p50: { type: Number, min: 0 },
      p95: { type: Number, min: 0 },
      p99: { type: Number, min: 0 },
      maxTime: { type: Number, min: 0 }
    },
    errors: {
      total: { type: Number, min: 0 },
      rate: { type: Number, min: 0 },
      byType: { type: Schema.Types.Mixed, default: {} },
      byEndpoint: { type: Schema.Types.Mixed, default: {} }
    },
    endpoints: [{
      path: { type: String, required: true },
      method: { type: String, required: true },
      requests: { type: Number, min: 0 },
      avgTime: { type: Number, min: 0 },
      errors: { type: Number, min: 0 },
      lastUsed: { type: Date, default: Date.now }
    }]
  },
  cache: {
    redis: {
      connected: { type: Boolean, default: false },
      memory: {
        used: { type: Number, min: 0 },
        peak: { type: Number, min: 0 },
        fragmentation: { type: Number, min: 0, max: 100 }
      },
      operations: {
        hits: { type: Number, min: 0 },
        misses: { type: Number, min: 0 },
        hitRate: { type: Number, min: 0, max: 100 },
        commands: { type: Number, min: 0 },
        keyspace: { type: Number, min: 0 }
      },
      clients: {
        connected: { type: Number, min: 0 },
        blocked: { type: Number, min: 0 }
      }
    },
    memory: {
      size: { type: Number, min: 0 },
      keys: { type: Number, min: 0 },
      hits: { type: Number, min: 0 },
      misses: { type: Number, min: 0 },
      hitRate: { type: Number, min: 0, max: 100 }
    }
  },
  externalServices: {
    livekit: {
      status: { type: String, enum: ['healthy', 'degraded', 'down'], default: 'healthy' },
      responseTime: { type: Number, min: 0 },
      errors: { type: Number, min: 0 },
      rooms: { type: Number, min: 0 },
      participants: { type: Number, min: 0 }
    },
    stripe: {
      status: { type: String, enum: ['healthy', 'degraded', 'down'], default: 'healthy' },
      responseTime: { type: Number, min: 0 },
      errors: { type: Number, min: 0 },
      requests: { type: Number, min: 0 }
    },
    openai: {
      status: { type: String, enum: ['healthy', 'degraded', 'down'], default: 'healthy' },
      responseTime: { type: Number, min: 0 },
      errors: { type: Number, min: 0 },
      tokens: { type: Number, min: 0 },
      cost: { type: Number, min: 0 }
    }
  },
  business: {
    users: {
      total: { type: Number, min: 0 },
      active: { type: Number, min: 0 },
      new: { type: Number, min: 0 },
      churn: { type: Number, min: 0 }
    },
    content: {
      total: { type: Number, min: 0 },
      created: { type: Number, min: 0 },
      accessed: { type: Number, min: 0 }
    },
    lessons: {
      total: { type: Number, min: 0 },
      completed: { type: Number, min: 0 },
      inProgress: { type: Number, min: 0 }
    },
    revenue: {
      total: { type: Number, min: 0 },
      thisPeriod: { type: Number, min: 0 },
      growth: { type: Number }
    }
  },
  alerts: [{
    type: { type: String, enum: ['cpu', 'memory', 'disk', 'database', 'api', 'cache', 'service'], required: true },
    severity: { type: String, enum: ['info', 'warning', 'error', 'critical'], required: true },
    message: { type: String, required: true },
    metric: { type: String, required: true },
    value: { type: Number, required: true },
    threshold: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  }],
  health: {
    overall: { type: String, enum: ['healthy', 'degraded', 'unhealthy', 'critical'], default: 'healthy' },
    checks: [{
      name: { type: String, required: true },
      status: { type: String, enum: ['pass', 'fail', 'warn'], required: true },
      responseTime: { type: Number, min: 0 },
      message: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    score: { type: Number, min: 0, max: 100, default: 100 }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  interval: {
    type: Number,
    default: 60, // 60 seconds
    min: 10
  },
  version: {
    type: String,
    required: true
  }
}, {
  timestamps: false
});

// Indexes for efficient querying
PerformanceMonitorSchema.index({ timestamp: -1 });
PerformanceMonitorSchema.index({ organizationId: 1, timestamp: -1 });
PerformanceMonitorSchema.index({ 'health.overall': 1 });
PerformanceMonitorSchema.index({ 'alerts.isActive': 1, 'alerts.severity': 1 });

// TTL index for automatic cleanup (keep 30 days of data)
PerformanceMonitorSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Virtual for system health status
PerformanceMonitorSchema.virtual('systemHealth').get(function() {
  const cpuUsage = this.system.cpu.usage;
  const memoryUsage = this.system.memory.usage;
  const diskUsage = this.system.disk.usage;
  
  if (cpuUsage > 90 || memoryUsage > 90 || diskUsage > 95) return 'critical';
  if (cpuUsage > 80 || memoryUsage > 80 || diskUsage > 85) return 'unhealthy';
  if (cpuUsage > 70 || memoryUsage > 70 || diskUsage > 75) return 'degraded';
  return 'healthy';
});

// Virtual for active alerts count
PerformanceMonitorSchema.virtual('activeAlertsCount').get(function() {
  return this.alerts.filter(alert => alert.isActive).length;
});

// Virtual for critical alerts count
PerformanceMonitorSchema.virtual('criticalAlertsCount').get(function() {
  return this.alerts.filter(alert => alert.isActive && alert.severity === 'critical').length;
});

// Method to calculate health score
PerformanceMonitorSchema.methods.calculateHealthScore = function(): number {
  let score = 100;
  
  // System metrics (40% weight)
  const systemScore = this.calculateSystemScore();
  score -= (100 - systemScore) * 0.4;
  
  // Application metrics (20% weight)
  const appScore = this.calculateApplicationScore();
  score -= (100 - appScore) * 0.2;
  
  // Database metrics (20% weight)
  const dbScore = this.calculateDatabaseScore();
  score -= (100 - dbScore) * 0.2;
  
  // API metrics (20% weight)
  const apiScore = this.calculateAPIScore();
  score -= (100 - apiScore) * 0.2;
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

// Method to calculate system score
PerformanceMonitorSchema.methods.calculateSystemScore = function(): number {
  let score = 100;
  
  // CPU usage penalty
  if (this.system.cpu.usage > 90) score -= 30;
  else if (this.system.cpu.usage > 80) score -= 20;
  else if (this.system.cpu.usage > 70) score -= 10;
  
  // Memory usage penalty
  if (this.system.memory.usage > 90) score -= 30;
  else if (this.system.memory.usage > 80) score -= 20;
  else if (this.system.memory.usage > 70) score -= 10;
  
  // Disk usage penalty
  if (this.system.disk.usage > 95) score -= 40;
  else if (this.system.disk.usage > 85) score -= 20;
  else if (this.system.disk.usage > 75) score -= 10;
  
  return Math.max(0, score);
};

// Method to calculate application score
PerformanceMonitorSchema.methods.calculateApplicationScore = function(): number {
  let score = 100;
  
  // Event loop lag penalty
  if (this.application.eventLoop.lag > 100) score -= 30;
  else if (this.application.eventLoop.lag > 50) score -= 15;
  else if (this.application.eventLoop.lag > 20) score -= 5;
  
  // Memory usage penalty
  const heapUsage = (this.application.memoryUsage.heapUsed / this.application.memoryUsage.heapTotal) * 100;
  if (heapUsage > 90) score -= 20;
  else if (heapUsage > 80) score -= 10;
  
  return Math.max(0, score);
};

// Method to calculate database score
PerformanceMonitorSchema.methods.calculateDatabaseScore = function(): number {
  let score = 100;
  
  // Connection pool penalty
  const connectionUsage = (this.database.connections.current / this.database.connections.max) * 100;
  if (connectionUsage > 90) score -= 30;
  else if (connectionUsage > 80) score -= 20;
  else if (connectionUsage > 70) score -= 10;
  
  // Query performance penalty
  if (this.database.performance.avgQueryTime > 1000) score -= 30;
  else if (this.database.performance.avgQueryTime > 500) score -= 20;
  else if (this.database.performance.avgQueryTime > 200) score -= 10;
  
  // Cache hit ratio penalty
  if (this.database.performance.cacheHitRatio < 50) score -= 20;
  else if (this.database.performance.cacheHitRatio < 70) score -= 10;
  
  return Math.max(0, score);
};

// Method to calculate API score
PerformanceMonitorSchema.methods.calculateAPIScore = function(): number {
  let score = 100;
  
  // Error rate penalty
  const errorRate = this.api.requests.total > 0 ? (this.api.errors.total / this.api.requests.total) * 100 : 0;
  if (errorRate > 10) score -= 40;
  else if (errorRate > 5) score -= 20;
  else if (errorRate > 1) score -= 10;
  
  // Response time penalty
  if (this.api.response.avgTime > 2000) score -= 30;
  else if (this.api.response.avgTime > 1000) score -= 20;
  else if (this.api.response.avgTime > 500) score -= 10;
  
  return Math.max(0, score);
};

// Method to add alert
PerformanceMonitorSchema.methods.addAlert = function(type: string, severity: string, message: string, metric: string, value: number, threshold: number) {
  this.alerts.push({
    type: type as any,
    severity: severity as any,
    message,
    metric,
    value,
    threshold,
    timestamp: new Date(),
    isActive: true
  });
};

// Method to resolve alert
PerformanceMonitorSchema.methods.resolveAlert = function(alertId: string) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.isActive = false;
  }
};

// Static method to get performance statistics
PerformanceMonitorSchema.statics.getStatistics = async function(organizationId: string, timeRange: string = '24h') {
  const startDate = new Date();
  
  switch (timeRange) {
    case '1h':
      startDate.setHours(startDate.getHours() - 1);
      break;
    case '6h':
      startDate.setHours(startDate.getHours() - 6);
      break;
    case '24h':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
  }
  
  const query: any = { timestamp: { $gte: startDate } };
  if (organizationId) query.organizationId = organizationId;
  
  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avgCpuUsage: { $avg: '$system.cpu.usage' },
        avgMemoryUsage: { $avg: '$system.memory.usage' },
        avgDiskUsage: { $avg: '$system.disk.usage' },
        avgResponseTime: { $avg: '$api.response.avgTime' },
        avgErrorRate: { $avg: { $divide: ['$api.errors.total', { $max: ['$api.requests.total', 1] }] } },
        totalRequests: { $sum: '$api.requests.total' },
        totalErrors: { $sum: '$api.errors.total' },
        avgHealthScore: { $avg: '$health.score' },
        minHealthScore: { $min: '$health.score' },
        maxHealthScore: { $max: '$health.score' }
      }
    }
  ]);
  
  return stats[0] || {
    avgCpuUsage: 0,
    avgMemoryUsage: 0,
    avgDiskUsage: 0,
    avgResponseTime: 0,
    avgErrorRate: 0,
    totalRequests: 0,
    totalErrors: 0,
    avgHealthScore: 100,
    minHealthScore: 100,
    maxHealthScore: 100
  };
};

export default mongoose.model<IPerformanceMonitor>('PerformanceMonitor', PerformanceMonitorSchema); 