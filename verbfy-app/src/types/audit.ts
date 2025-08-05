export interface AuditLog {
  _id: string;
  organizationId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: {
    before?: any;
    after?: any;
    changes?: any;
    metadata?: any;
  };
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
    ip: string;
    userAgent: string;
  };
  response: {
    statusCode: number;
    body?: any;
    headers: Record<string, string>;
  };
  userContext: {
    userId: string;
    email: string;
    role: string;
    organizationId: string;
    sessionId: string;
  };
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security' | 'user_management' | 'content_management' | 'financial' | 'api_access';
  tags: string[];
  compliance: {
    gdpr: boolean;
    retention: {
      policy: string;
      expiresAt?: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogFilters {
  organizationId?: string;
  userId?: string;
  action?: string;
  resource?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security' | 'user_management' | 'content_management' | 'financial' | 'api_access';
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogStats {
  totalLogs: number;
  logsBySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  logsByCategory: {
    authentication: number;
    authorization: number;
    data_access: number;
    data_modification: number;
    system: number;
    security: number;
    user_management: number;
    content_management: number;
    financial: number;
    api_access: number;
  };
  logsByDate: {
    date: string;
    count: number;
  }[];
  topActions: {
    action: string;
    count: number;
  }[];
  topUsers: {
    userId: string;
    email: string;
    count: number;
  }[];
  topResources: {
    resource: string;
    count: number;
  }[];
}

export interface AuditLogExportRequest {
  filters: AuditLogFilters;
  format: 'csv' | 'json' | 'pdf';
  includeDetails?: boolean;
  includeHeaders?: boolean;
}

export interface AuditLogExportResponse {
  downloadUrl: string;
  expiresAt: Date;
  recordCount: number;
}

export interface AuditLogRetentionPolicy {
  organizationId: string;
  policy: {
    defaultRetentionDays: number;
    categories: {
      [key: string]: number;
    };
    severity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  enabled: boolean;
  lastCleanup: Date;
  nextCleanup: Date;
}

export interface AuditLogAlert {
  _id: string;
  organizationId: string;
  name: string;
  description: string;
  conditions: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: string;
    action?: string;
    resource?: string;
    threshold: number;
    timeWindow: number; // minutes
  };
  actions: {
    type: 'email' | 'webhook' | 'notification';
    config: any;
  }[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogSearchRequest {
  query: string;
  filters?: AuditLogFilters;
  page?: number;
  limit?: number;
}

export interface AuditLogSearchResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: {
    severity: Record<string, number>;
    category: Record<string, number>;
    action: Record<string, number>;
    resource: Record<string, number>;
  };
} 