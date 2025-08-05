import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string; // Unique identifier for the organization
  type: 'school' | 'university' | 'company' | 'institution' | 'individual';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  
  // Contact Information
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
  
  // Branding & Customization
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
  
  // Subscription & Billing
  subscription: {
    plan: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom';
    status: 'active' | 'expired' | 'cancelled' | 'pending';
    startDate: Date;
    endDate: Date;
    maxUsers: number;
    maxStorage: number; // in GB
    features: string[];
    billingCycle: 'monthly' | 'yearly' | 'custom';
    nextBillingDate?: Date;
  };
  
  // Settings & Configuration
  settings: {
    allowUserRegistration: boolean;
    requireEmailVerification: boolean;
    requireAdminApproval: boolean;
    allowFileUploads: boolean;
    maxFileSize: number; // in MB
    allowedFileTypes: string[];
    sessionTimeout: number; // in minutes
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
  
  // Statistics & Usage
  statistics: {
    totalUsers: number;
    activeUsers: number;
    totalLessons: number;
    totalContent: number;
    storageUsed: number; // in GB
    lastActivity: Date;
  };
  
  // Admin & Management
  admins: Array<{
    userId: mongoose.Types.ObjectId;
    role: 'owner' | 'admin' | 'manager';
    permissions: string[];
    addedAt: Date;
    addedBy: mongoose.Types.ObjectId;
  }>;
  
  // Integration & API
  integrations: {
    sso: {
      enabled: boolean;
      provider: 'saml' | 'oauth' | 'ldap' | 'custom';
      config: any;
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
      lastUsed?: Date;
      createdAt: Date;
    }>;
  };
  
  // Compliance & Legal
  compliance: {
    gdprCompliant: boolean;
    dataRetentionDays: number;
    privacyPolicyUrl?: string;
    termsOfServiceUrl?: string;
    cookiePolicyUrl?: string;
    dataProcessingAgreement?: boolean;
  };
  
  // Audit & Logging
  audit: {
    enabled: boolean;
    retentionDays: number;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/
  },
  type: {
    type: String,
    enum: ['school', 'university', 'company', 'institution', 'individual'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'pending'
  },
  contact: {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      postalCode: { type: String, trim: true }
    },
    website: {
      type: String,
      trim: true
    }
  },
  branding: {
    logo: { type: String },
    favicon: { type: String },
    primaryColor: {
      type: String,
      default: '#3B82F6',
      match: /^#[0-9A-F]{6}$/i
    },
    secondaryColor: {
      type: String,
      default: '#1F2937',
      match: /^#[0-9A-F]{6}$/i
    },
    customDomain: {
      type: String,
      trim: true
    },
    customCss: { type: String },
    customJs: { type: String },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise', 'custom'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'pending'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    maxUsers: {
      type: Number,
      default: 10,
      min: 1
    },
    maxStorage: {
      type: Number,
      default: 1, // 1 GB
      min: 0
    },
    features: [{
      type: String,
      enum: [
        'ai_content_generation',
        'advanced_analytics',
        'white_label',
        'custom_domain',
        'api_access',
        'bulk_operations',
        'advanced_security',
        'priority_support'
      ]
    }],
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'custom'],
      default: 'monthly'
    },
    nextBillingDate: { type: Date }
  },
  settings: {
    allowUserRegistration: {
      type: Boolean,
      default: true
    },
    requireEmailVerification: {
      type: Boolean,
      default: true
    },
    requireAdminApproval: {
      type: Boolean,
      default: false
    },
    allowFileUploads: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 10, // 10 MB
      min: 1
    },
    allowedFileTypes: [{
      type: String,
      enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'wav']
    }],
    sessionTimeout: {
      type: Number,
      default: 480, // 8 hours
      min: 15
    },
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8,
        min: 6
      },
      requireUppercase: {
        type: Boolean,
        default: true
      },
      requireLowercase: {
        type: Boolean,
        default: true
      },
      requireNumbers: {
        type: Boolean,
        default: true
      },
      requireSpecialChars: {
        type: Boolean,
        default: false
      }
    },
    aiFeatures: {
      enabled: {
        type: Boolean,
        default: true
      },
      dailyLimit: {
        type: Number,
        default: 100,
        min: 0
      },
      modelAccess: [{
        type: String,
        enum: ['gpt-3.5-turbo', 'gpt-4', 'claude-3', 'custom']
      }]
    }
  },
  statistics: {
    totalUsers: {
      type: Number,
      default: 0,
      min: 0
    },
    activeUsers: {
      type: Number,
      default: 0,
      min: 0
    },
    totalLessons: {
      type: Number,
      default: 0,
      min: 0
    },
    totalContent: {
      type: Number,
      default: 0,
      min: 0
    },
    storageUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  admins: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'manager'],
      default: 'manager'
    },
    permissions: [{
      type: String
    }],
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  integrations: {
    sso: {
      enabled: {
        type: Boolean,
        default: false
      },
      provider: {
        type: String,
        enum: ['saml', 'oauth', 'ldap', 'custom']
      },
      config: {
        type: Schema.Types.Mixed
      }
    },
    webhooks: [{
      url: {
        type: String,
        required: true
      },
      events: [{
        type: String,
        enum: [
          'user.created',
          'user.updated',
          'lesson.created',
          'lesson.completed',
          'payment.received',
          'subscription.expired'
        ]
      }],
      secret: {
        type: String,
        required: true
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    apiKeys: [{
      key: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      permissions: [{
        type: String
      }],
      isActive: {
        type: Boolean,
        default: true
      },
      lastUsed: { type: Date },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  compliance: {
    gdprCompliant: {
      type: Boolean,
      default: false
    },
    dataRetentionDays: {
      type: Number,
      default: 2555, // 7 years
      min: 30
    },
    privacyPolicyUrl: { type: String },
    termsOfServiceUrl: { type: String },
    cookiePolicyUrl: { type: String },
    dataProcessingAgreement: {
      type: Boolean,
      default: false
    }
  },
  audit: {
    enabled: {
      type: Boolean,
      default: true
    },
    retentionDays: {
      type: Number,
      default: 365,
      min: 30
    },
    logLevel: {
      type: String,
      enum: ['error', 'warn', 'info', 'debug'],
      default: 'info'
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
OrganizationSchema.index({ slug: 1 });
OrganizationSchema.index({ status: 1 });
OrganizationSchema.index({ 'subscription.status': 1 });
OrganizationSchema.index({ 'branding.customDomain': 1 });
OrganizationSchema.index({ 'contact.email': 1 });

// Virtual for subscription status
OrganizationSchema.virtual('isSubscriptionActive').get(function() {
  return this.subscription.status === 'active' && this.subscription.endDate > new Date();
});

// Virtual for storage usage percentage
OrganizationSchema.virtual('storageUsagePercentage').get(function() {
  if (this.subscription.maxStorage === 0) return 0;
  return (this.statistics.storageUsed / this.subscription.maxStorage) * 100;
});

// Virtual for user usage percentage
OrganizationSchema.virtual('userUsagePercentage').get(function() {
  if (this.subscription.maxUsers === 0) return 0;
  return (this.statistics.totalUsers / this.subscription.maxUsers) * 100;
});

// Method to check if organization can add more users
OrganizationSchema.methods.canAddUser = function(): boolean {
  return this.statistics.totalUsers < this.subscription.maxUsers;
};

// Method to check if organization can use more storage
OrganizationSchema.methods.canUseStorage = function(sizeInGB: number): boolean {
  return (this.statistics.storageUsed + sizeInGB) <= this.subscription.maxStorage;
};

// Method to check if feature is enabled
OrganizationSchema.methods.hasFeature = function(feature: string): boolean {
  return this.subscription.features.includes(feature);
};

  // Method to check if user is admin
  OrganizationSchema.methods.isUserAdmin = function(userId: string): boolean {
    return this.admins.some((admin: any) => admin.userId.toString() === userId);
  };

  // Method to get user admin role
  OrganizationSchema.methods.getUserAdminRole = function(userId: string): string | null {
    const admin = this.admins.find((admin: any) => admin.userId.toString() === userId);
    return admin ? admin.role : null;
  };

// Pre-save middleware to validate subscription dates
OrganizationSchema.pre('save', function(next) {
  if (this.subscription.endDate <= this.subscription.startDate) {
    return next(new Error('Subscription end date must be after start date'));
  }
  next();
});

export default mongoose.model<IOrganization>('Organization', OrganizationSchema); 