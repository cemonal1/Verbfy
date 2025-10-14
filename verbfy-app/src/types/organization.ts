export interface Organization {
  _id: string;
  name: string;
  slug: string;
  type: 'school' | 'university' | 'company' | 'institution' | 'individual';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  
  contact: {
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    website?: string;
  };
  
  branding: {
    logo?: string;
    favicon?: string;
    primaryColor: string;
    secondaryColor: string;
    customDomain?: string;
    customCss?: string;
    customJs?: string;
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
  };
  
  subscription: {
    plan: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom';
    status: 'active' | 'expired' | 'cancelled' | 'pending';
    startDate: string;
    endDate: string;
    maxUsers: number;
    maxStorage: number;
    features: string[];
    billingCycle: 'monthly' | 'yearly' | 'custom';
    nextBillingDate?: string;
  };
  
  settings: {
    allowUserRegistration: boolean;
    requireEmailVerification: boolean;
    requireAdminApproval: boolean;
    allowFileUploads: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    aiFeatures: {
      enabled: boolean;
      dailyLimit: number;
      modelAccess: string[];
    };
  };
  
  statistics: {
    totalUsers: number;
    activeUsers: number;
    totalLessons: number;
    totalContent: number;
    storageUsed: number;
    lastActivity: string;
  };
  
  admins: Array<{
    userId: string;
    role: 'owner' | 'admin' | 'manager';
    permissions: string[];
    addedAt: string;
    addedBy: string;
  }>;
  
  integrations: {
    sso: {
      enabled: boolean;
      provider: 'saml' | 'oauth' | 'ldap' | 'custom';
      config: unknown;
    };
    webhooks: Array<{
      url: string;
      events: string[];
      secret: string;
      isActive: boolean;
    }>;
    apiKeys: Array<{
      key: string;
      name: string;
      permissions: string[];
      isActive: boolean;
      lastUsed?: string;
      createdAt: string;
    }>;
  };
  
  compliance: {
    gdprCompliant: boolean;
    dataRetentionDays: number;
    privacyPolicyUrl?: string;
    termsOfServiceUrl?: string;
    cookiePolicyUrl?: string;
    dataProcessingAgreement?: boolean;
  };
  
  audit: {
    enabled: boolean;
    retentionDays: number;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  type: 'school' | 'university' | 'company' | 'institution' | 'individual';
  contact: {
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    website?: string;
  };
  branding?: {
    logo?: string;
    favicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
    customCss?: string;
    customJs?: string;
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    timezone?: string;
  };
  subscription?: {
    plan?: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom';
    maxUsers?: number;
    maxStorage?: number;
    features?: string[];
    billingCycle?: 'monthly' | 'yearly' | 'custom';
  };
  settings?: {
    allowUserRegistration?: boolean;
    requireEmailVerification?: boolean;
    requireAdminApproval?: boolean;
    allowFileUploads?: boolean;
    maxFileSize?: number;
    allowedFileTypes?: string[];
    sessionTimeout?: number;
    passwordPolicy?: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
    };
    aiFeatures?: {
      enabled?: boolean;
      dailyLimit?: number;
      modelAccess?: string[];
    };
  };
}

export interface UpdateOrganizationRequest {
  contact?: {
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    website?: string;
  };
  branding?: {
    logo?: string;
    favicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
    customCss?: string;
    customJs?: string;
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    timezone?: string;
  };
  subscription?: {
    plan?: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom';
    maxUsers?: number;
    maxStorage?: number;
    features?: string[];
    billingCycle?: 'monthly' | 'yearly' | 'custom';
  };
  settings?: {
    allowUserRegistration?: boolean;
    requireEmailVerification?: boolean;
    requireAdminApproval?: boolean;
    allowFileUploads?: boolean;
    maxFileSize?: number;
    allowedFileTypes?: string[];
    sessionTimeout?: number;
    passwordPolicy?: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
    };
    aiFeatures?: {
      enabled?: boolean;
      dailyLimit?: number;
      modelAccess?: string[];
    };
  };
}

export interface OrganizationStats {
  users: {
    total: number;
    active: number;
    new: number;
    churn: number;
  };
  content: {
    total: number;
    created: number;
    accessed: number;
  };
  storage: {
    used: number;
    limit: number;
    usagePercentage: number;
  };
  subscription: {
    plan: string;
    status: string;
    nextBilling?: string;
    features: string[];
  };
}

export interface ManageAdminRequest {
  action: 'add' | 'update' | 'remove';
  adminUserId: string;
  role?: 'owner' | 'admin' | 'manager';
  permissions?: string[];
}

export interface BulkOperationRequest {
  operation: 'update_role' | 'update_status' | 'delete';
  userIds: string[];
  data: {
    role?: string;
    status?: string;
  };
}

export interface OrganizationFilters {
  type?: 'school' | 'university' | 'company' | 'institution' | 'individual';
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  plan?: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom';
  page?: number;
  limit?: number;
  search?: string;
}

export interface OrganizationResponse {
  success: boolean;
  data: Organization;
  message?: string;
}

export interface OrganizationStatsResponse {
  success: boolean;
  data: OrganizationStats;
}

export interface OrganizationListResponse {
  success: boolean;
  data: Organization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}