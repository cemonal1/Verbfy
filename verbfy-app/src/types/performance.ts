export interface PerformanceMetrics {
  _id: string;
  organizationId: string;
  timestamp: Date;
  
  // System Metrics
  system: {
    cpu: {
      usage: number; // percentage
      load: number;
      cores: number;
      temperature?: number;
    };
    memory: {
      total: number; // bytes
      used: number; // bytes
      available: number; // bytes
      usage: number; // percentage
    };
    disk: {
      total: number; // bytes
      used: number; // bytes
      available: number; // bytes
      usage: number; // percentage
      readSpeed: number; // bytes per second
      writeSpeed: number; // bytes per second
    };
    network: {
      bytesIn: number; // bytes per second
      bytesOut: number; // bytes per second
      packetsIn: number; // packets per second
      packetsOut: number; // packets per second
      connections: number;
    };
  };
  
  // Application Metrics
  application: {
    responseTime: {
      average: number; // milliseconds
      p50: number; // milliseconds
      p95: number; // milliseconds
      p99: number; // milliseconds
    };
    throughput: {
      requestsPerSecond: number;
      errorsPerSecond: number;
      successRate: number; // percentage
    };
    memory: {
      heapUsed: number; // bytes
      heapTotal: number; // bytes
      external: number; // bytes
      rss: number; // bytes
    };
    uptime: number; // seconds
    activeConnections: number;
  };
  
  // Database Metrics
  database: {
    connections: {
      active: number;
      idle: number;
      max: number;
      usage: number; // percentage
    };
    queries: {
      total: number;
      slow: number; // queries > 100ms
      errors: number;
      averageTime: number; // milliseconds
    };
    performance: {
      readLatency: number; // milliseconds
      writeLatency: number; // milliseconds
      indexHitRatio: number; // percentage
      cacheHitRatio: number; // percentage
    };
    storage: {
      size: number; // bytes
      growth: number; // bytes per day
      fragmentation: number; // percentage
    };
  };
  
  // API Metrics
  api: {
    endpoints: {
      total: number;
      active: number;
      errors: number;
    };
    requests: {
      total: number;
      successful: number;
      failed: number;
      rate: number; // requests per second
    };
    responseCodes: {
      '2xx': number;
      '3xx': number;
      '4xx': number;
      '5xx': number;
    };
    latency: {
      average: number; // milliseconds
      p50: number; // milliseconds
      p95: number; // milliseconds
      p99: number; // milliseconds
    };
  };
  
  // Cache Metrics
  cache: {
    redis: {
      connected: boolean;
      memory: {
        used: number; // bytes
        peak: number; // bytes
        fragmentation: number; // percentage
      };
      operations: {
        hits: number;
        misses: number;
        hitRate: number; // percentage
        commands: number; // commands per second
      };
      keys: {
        total: number;
        expired: number;
        evicted: number;
      };
    };
  };
  
  // External Services
  externalServices: {
    stripe: {
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number; // milliseconds
      errorRate: number; // percentage
    };
    livekit: {
      status: 'healthy' | 'degraded' | 'down';
      rooms: number;
      participants: number;
      responseTime: number; // milliseconds
    };
    email: {
      status: 'healthy' | 'degraded' | 'down';
      sent: number;
      failed: number;
      queueSize: number;
    };
  };
  
  // Business Metrics
  business: {
    users: {
      total: number;
      active: number;
      new: number;
      churn: number;
    };
    sessions: {
      total: number;
      active: number;
      averageDuration: number; // seconds
    };
    lessons: {
      total: number;
      active: number;
      completed: number;
      averageDuration: number; // minutes
    };
    revenue: {
      daily: number;
      monthly: number;
      growth: number; // percentage
    };
  };
  
  // Alerts
  alerts: {
    critical: number;
    warning: number;
    info: number;
    resolved: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceAlert {
  _id: string;
  organizationId: string;
  type: 'system' | 'application' | 'database' | 'api' | 'cache' | 'external' | 'business';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  metric: string;
  threshold: number;
  currentValue: number;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceDashboard {
  currentMetrics: PerformanceMetrics;
  historicalData: {
    system: {
      cpu: { timestamp: string; usage: number }[];
      memory: { timestamp: string; usage: number }[];
      disk: { timestamp: string; usage: number }[];
    };
    application: {
      responseTime: { timestamp: string; average: number }[];
      throughput: { timestamp: string; requestsPerSecond: number }[];
      errorRate: { timestamp: string; rate: number }[];
    };
    database: {
      connections: { timestamp: string; usage: number }[];
      queries: { timestamp: string; averageTime: number }[];
    };
    api: {
      requests: { timestamp: string; rate: number }[];
      latency: { timestamp: string; average: number }[];
    };
  };
  alerts: PerformanceAlert[];
  summary: {
    systemHealth: 'healthy' | 'degraded' | 'critical';
    applicationHealth: 'healthy' | 'degraded' | 'critical';
    databaseHealth: 'healthy' | 'degraded' | 'critical';
    apiHealth: 'healthy' | 'degraded' | 'critical';
    overallHealth: 'healthy' | 'degraded' | 'critical';
  };
}

export interface PerformanceFilters {
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  type?: 'system' | 'application' | 'database' | 'api' | 'cache' | 'external' | 'business';
  severity?: 'critical' | 'warning' | 'info';
  status?: 'active' | 'acknowledged' | 'resolved';
  page?: number;
  limit?: number;
}

export interface PerformanceReport {
  _id: string;
  organizationId: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    system: {
      averageCpuUsage: number;
      averageMemoryUsage: number;
      averageDiskUsage: number;
      uptime: number;
    };
    application: {
      averageResponseTime: number;
      totalRequests: number;
      errorRate: number;
      availability: number;
    };
    database: {
      averageQueryTime: number;
      totalQueries: number;
      connectionUsage: number;
    };
    business: {
      totalUsers: number;
      activeUsers: number;
      totalLessons: number;
      revenue: number;
    };
  };
  insights: string[];
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceSettings {
  organizationId: string;
  monitoring: {
    enabled: boolean;
    interval: number; // seconds
    retention: number; // days
  };
  alerts: {
    enabled: boolean;
    channels: {
      email: boolean;
      slack: boolean;
      webhook: boolean;
    };
    thresholds: {
      cpu: number;
      memory: number;
      disk: number;
      responseTime: number;
      errorRate: number;
    };
  };
  dashboards: {
    defaultRefresh: number; // seconds
    maxDataPoints: number;
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  };
  updatedAt: Date;
} 