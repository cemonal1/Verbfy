import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: 'system' | 'custom' | 'inherited';
  parentRoleId?: mongoose.Types.ObjectId; // For role hierarchies
  
  // Permissions
  permissions: {
    // User Management
    users: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      bulk_operations: boolean;
    };
    
    // Content Management
    content: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      approve: boolean;
      publish: boolean;
    };
    
    // Lesson Management
    lessons: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      assign: boolean;
      grade: boolean;
    };
    
    // Analytics & Reports
    analytics: {
      view: boolean;
      export: boolean;
      custom_reports: boolean;
      system_analytics: boolean;
    };
    
    // Organization Management
    organization: {
      view_settings: boolean;
      edit_settings: boolean;
      manage_billing: boolean;
      manage_branding: boolean;
      manage_integrations: boolean;
    };
    
    // Role Management
    roles: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      assign: boolean;
    };
    
    // AI Features
    ai: {
      use_content_generation: boolean;
      use_learning_assistant: boolean;
      use_analytics: boolean;
      manage_ai_settings: boolean;
    };
    
    // Communication
    communication: {
      send_messages: boolean;
      create_rooms: boolean;
      moderate_chat: boolean;
      send_notifications: boolean;
    };
    
    // Financial
    financial: {
      view_payments: boolean;
      process_refunds: boolean;
      view_reports: boolean;
      manage_subscriptions: boolean;
    };
    
    // System Administration
    system: {
      view_logs: boolean;
      manage_backups: boolean;
      system_settings: boolean;
      security_settings: boolean;
    };
  };
  
  // Constraints & Limitations
  constraints: {
    maxUsers?: number;
    maxContent?: number;
    maxStorage?: number; // in GB
    allowedFileTypes?: string[];
    maxFileSize?: number; // in MB
    sessionTimeout?: number; // in minutes
    aiDailyLimit?: number;
  };
  
  // Metadata
  isActive: boolean;
  isDefault: boolean;
  priority: number; // Higher number = higher priority
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  getAllPermissions(): string[];
  canPerformAction(action: string, currentUsage: any): boolean;
  inheritFromParent(): Promise<void>;
}

// Static methods interface
export interface IRoleModel extends mongoose.Model<IRole> {
  createDefaultRoles(organizationId: string, createdBy: string): Promise<IRole[]>;
}

const RoleSchema = new Schema<IRole>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['system', 'custom', 'inherited'],
    default: 'custom'
  },
  parentRoleId: {
    type: Schema.Types.ObjectId,
    ref: 'Role'
  },
  permissions: {
    users: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      bulk_operations: { type: Boolean, default: false }
    },
    content: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      approve: { type: Boolean, default: false },
      publish: { type: Boolean, default: false }
    },
    lessons: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      assign: { type: Boolean, default: false },
      grade: { type: Boolean, default: false }
    },
    analytics: {
      view: { type: Boolean, default: false },
      export: { type: Boolean, default: false },
      custom_reports: { type: Boolean, default: false },
      system_analytics: { type: Boolean, default: false }
    },
    organization: {
      view_settings: { type: Boolean, default: false },
      edit_settings: { type: Boolean, default: false },
      manage_billing: { type: Boolean, default: false },
      manage_branding: { type: Boolean, default: false },
      manage_integrations: { type: Boolean, default: false }
    },
    roles: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      assign: { type: Boolean, default: false }
    },
    ai: {
      use_content_generation: { type: Boolean, default: false },
      use_learning_assistant: { type: Boolean, default: false },
      use_analytics: { type: Boolean, default: false },
      manage_ai_settings: { type: Boolean, default: false }
    },
    communication: {
      send_messages: { type: Boolean, default: false },
      create_rooms: { type: Boolean, default: false },
      moderate_chat: { type: Boolean, default: false },
      send_notifications: { type: Boolean, default: false }
    },
    financial: {
      view_payments: { type: Boolean, default: false },
      process_refunds: { type: Boolean, default: false },
      view_reports: { type: Boolean, default: false },
      manage_subscriptions: { type: Boolean, default: false }
    },
    system: {
      view_logs: { type: Boolean, default: false },
      manage_backups: { type: Boolean, default: false },
      system_settings: { type: Boolean, default: false },
      security_settings: { type: Boolean, default: false }
    }
  },
  constraints: {
    maxUsers: { type: Number, min: 0 },
    maxContent: { type: Number, min: 0 },
    maxStorage: { type: Number, min: 0 },
    allowedFileTypes: [{
      type: String,
      enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'wav']
    }],
    maxFileSize: { type: Number, min: 1 },
    sessionTimeout: { type: Number, min: 15 },
    aiDailyLimit: { type: Number, min: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
RoleSchema.index({ organizationId: 1, isActive: 1 });
RoleSchema.index({ organizationId: 1, type: 1 });
RoleSchema.index({ parentRoleId: 1 });
RoleSchema.index({ priority: -1 });

// Virtual for inherited permissions
RoleSchema.virtual('inheritedPermissions').get(function() {
  if (!this.parentRoleId) return null;
  return this.populate('parentRoleId');
});

// Method to check if role has specific permission
RoleSchema.methods.hasPermission = function(category: string, action: string): boolean {
  const categoryPermissions = this.permissions[category as keyof typeof this.permissions];
  if (!categoryPermissions) return false;
  
  return categoryPermissions[action as keyof typeof categoryPermissions] || false;
};

// Method to check if role has any permission in category
RoleSchema.methods.hasAnyPermission = function(category: string): boolean {
  const categoryPermissions = this.permissions[category as keyof typeof this.permissions];
  if (!categoryPermissions) return false;
  
  return Object.values(categoryPermissions).some(permission => permission === true);
};

// Method to get all permissions as flat array
RoleSchema.methods.getAllPermissions = function(): string[] {
  const permissions: string[] = [];
  
  Object.entries(this.permissions).forEach(([category, categoryPermissions]) => {
    Object.entries(categoryPermissions as Record<string, boolean>).forEach(([action, hasPermission]) => {
      if (hasPermission) {
        permissions.push(`${category}.${action}`);
      }
    });
  });
  
  return permissions;
};

// Method to check if role can perform action based on constraints
RoleSchema.methods.canPerformAction = function(action: string, currentUsage: any): boolean {
  const constraints = this.constraints;
  
  switch (action) {
    case 'create_user':
      return !constraints.maxUsers || currentUsage.users < constraints.maxUsers;
    case 'create_content':
      return !constraints.maxContent || currentUsage.content < constraints.maxContent;
    case 'use_storage':
      return !constraints.maxStorage || currentUsage.storage < constraints.maxStorage;
    case 'use_ai':
      return !constraints.aiDailyLimit || currentUsage.aiUsage < constraints.aiDailyLimit;
    default:
      return true;
  }
};

  // Method to inherit permissions from parent role
  RoleSchema.methods.inheritFromParent = async function(): Promise<void> {
    if (!this.parentRoleId) return;
    
    const parentRole = await mongoose.model('Role').findById(this.parentRoleId);
    if (!parentRole) return;
    
    // Inherit permissions (child can override)
    Object.entries(parentRole.permissions).forEach(([category, categoryPermissions]: [string, any]) => {
      if (!this.permissions[category as keyof typeof this.permissions]) {
        this.permissions[category as keyof typeof this.permissions] = categoryPermissions;
      } else {
        Object.entries(categoryPermissions).forEach(([action, hasPermission]: [string, any]) => {
          const currentPermission = this.permissions[category as keyof typeof this.permissions][action as keyof typeof categoryPermissions];
          if (currentPermission === undefined) {
            this.permissions[category as keyof typeof this.permissions][action as keyof typeof categoryPermissions] = hasPermission;
          }
        });
      }
    });
    
    // Inherit constraints (child can override)
    Object.entries(parentRole.constraints).forEach(([constraint, value]: [string, any]) => {
      if (this.constraints[constraint as keyof typeof this.constraints] === undefined) {
        this.constraints[constraint as keyof typeof this.constraints] = value;
      }
    });
  };

// Pre-save middleware to inherit permissions
RoleSchema.pre('save', async function(next) {
  if (this.isModified('parentRoleId') && this.parentRoleId) {
    await this.inheritFromParent();
  }
  next();
});

// Static method to create default roles for organization
RoleSchema.statics.createDefaultRoles = async function(organizationId: string, createdBy: string) {
  const defaultRoles = [
    {
      name: 'Owner',
      description: 'Full access to all features and settings',
      type: 'system',
      priority: 100,
      permissions: {
        users: { view: true, create: true, edit: true, delete: true, bulk_operations: true },
        content: { view: true, create: true, edit: true, delete: true, approve: true, publish: true },
        lessons: { view: true, create: true, edit: true, delete: true, assign: true, grade: true },
        analytics: { view: true, export: true, custom_reports: true, system_analytics: true },
        organization: { view_settings: true, edit_settings: true, manage_billing: true, manage_branding: true, manage_integrations: true },
        roles: { view: true, create: true, edit: true, delete: true, assign: true },
        ai: { use_content_generation: true, use_learning_assistant: true, use_analytics: true, manage_ai_settings: true },
        communication: { send_messages: true, create_rooms: true, moderate_chat: true, send_notifications: true },
        financial: { view_payments: true, process_refunds: true, view_reports: true, manage_subscriptions: true },
        system: { view_logs: true, manage_backups: true, system_settings: true, security_settings: true }
      },
      isDefault: true
    },
    {
      name: 'Admin',
      description: 'Administrative access with most features',
      type: 'system',
      priority: 80,
      permissions: {
        users: { view: true, create: true, edit: true, delete: false, bulk_operations: true },
        content: { view: true, create: true, edit: true, delete: true, approve: true, publish: true },
        lessons: { view: true, create: true, edit: true, delete: true, assign: true, grade: true },
        analytics: { view: true, export: true, custom_reports: true, system_analytics: false },
        organization: { view_settings: true, edit_settings: true, manage_billing: false, manage_branding: true, manage_integrations: false },
        roles: { view: true, create: true, edit: true, delete: false, assign: true },
        ai: { use_content_generation: true, use_learning_assistant: true, use_analytics: true, manage_ai_settings: false },
        communication: { send_messages: true, create_rooms: true, moderate_chat: true, send_notifications: true },
        financial: { view_payments: true, process_refunds: false, view_reports: true, manage_subscriptions: false },
        system: { view_logs: true, manage_backups: false, system_settings: false, security_settings: false }
      },
      isDefault: true
    },
    {
      name: 'Teacher',
      description: 'Teacher access with lesson and content management',
      type: 'system',
      priority: 60,
      permissions: {
        users: { view: true, create: false, edit: false, delete: false, bulk_operations: false },
        content: { view: true, create: true, edit: true, delete: false, approve: false, publish: false },
        lessons: { view: true, create: true, edit: true, delete: false, assign: true, grade: true },
        analytics: { view: true, export: false, custom_reports: false, system_analytics: false },
        organization: { view_settings: false, edit_settings: false, manage_billing: false, manage_branding: false, manage_integrations: false },
        roles: { view: false, create: false, edit: false, delete: false, assign: false },
        ai: { use_content_generation: true, use_learning_assistant: true, use_analytics: false, manage_ai_settings: false },
        communication: { send_messages: true, create_rooms: true, moderate_chat: true, send_notifications: false },
        financial: { view_payments: false, process_refunds: false, view_reports: false, manage_subscriptions: false },
        system: { view_logs: false, manage_backups: false, system_settings: false, security_settings: false }
      },
      isDefault: true
    },
    {
      name: 'Student',
      description: 'Student access with learning features',
      type: 'system',
      priority: 40,
      permissions: {
        users: { view: false, create: false, edit: false, delete: false, bulk_operations: false },
        content: { view: true, create: false, edit: false, delete: false, approve: false, publish: false },
        lessons: { view: true, create: false, edit: false, delete: false, assign: false, grade: false },
        analytics: { view: true, export: false, custom_reports: false, system_analytics: false },
        organization: { view_settings: false, edit_settings: false, manage_billing: false, manage_branding: false, manage_integrations: false },
        roles: { view: false, create: false, edit: false, delete: false, assign: false },
        ai: { use_content_generation: false, use_learning_assistant: true, use_analytics: false, manage_ai_settings: false },
        communication: { send_messages: true, create_rooms: false, moderate_chat: false, send_notifications: false },
        financial: { view_payments: false, process_refunds: false, view_reports: false, manage_subscriptions: false },
        system: { view_logs: false, manage_backups: false, system_settings: false, security_settings: false }
      },
      isDefault: true
    }
  ];
  
  const roles = [];
  for (const roleData of defaultRoles) {
    const role = new this({
      organizationId,
      createdBy,
      updatedBy: createdBy,
      ...roleData
    });
    roles.push(await role.save());
  }
  
  return roles;
};

export default mongoose.model<IRole, IRoleModel>('Role', RoleSchema); 