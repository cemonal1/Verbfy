export interface Role {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'system' | 'custom' | 'inherited';
  parentRoleId?: string;
  
  permissions: {
    users: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      bulk_operations: boolean;
    };
    content: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      approve: boolean;
      publish: boolean;
    };
    lessons: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      assign: boolean;
      grade: boolean;
    };
    analytics: {
      view: boolean;
      export: boolean;
      custom_reports: boolean;
      system_analytics: boolean;
    };
    organization: {
      view_settings: boolean;
      edit_settings: boolean;
      manage_billing: boolean;
      manage_branding: boolean;
      manage_integrations: boolean;
    };
    roles: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      assign: boolean;
    };
    ai: {
      use_content_generation: boolean;
      use_learning_assistant: boolean;
      use_analytics: boolean;
      manage_ai_settings: boolean;
    };
    communication: {
      send_messages: boolean;
      create_rooms: boolean;
      moderate_chat: boolean;
      send_notifications: boolean;
    };
    financial: {
      view_payments: boolean;
      process_refunds: boolean;
      view_reports: boolean;
      manage_subscriptions: boolean;
    };
    system: {
      view_logs: boolean;
      manage_backups: boolean;
      system_settings: boolean;
      security_settings: boolean;
    };
  };
  
  constraints: {
    maxUsers?: number;
    maxContent?: number;
    maxStorage?: number;
    allowedFileTypes?: string[];
    maxFileSize?: number;
    sessionTimeout?: number;
    aiDailyLimit?: number;
  };
  
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  type?: 'system' | 'custom' | 'inherited';
  parentRoleId?: string;
  permissions?: {
    users?: {
      view?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
      bulk_operations?: boolean;
    };
    content?: {
      view?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
      approve?: boolean;
      publish?: boolean;
    };
    lessons?: {
      view?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
      assign?: boolean;
      grade?: boolean;
    };
    analytics?: {
      view?: boolean;
      export?: boolean;
      custom_reports?: boolean;
      system_analytics?: boolean;
    };
    organization?: {
      view_settings?: boolean;
      edit_settings?: boolean;
      manage_billing?: boolean;
      manage_branding?: boolean;
      manage_integrations?: boolean;
    };
    roles?: {
      view?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
      assign?: boolean;
    };
    ai?: {
      use_content_generation?: boolean;
      use_learning_assistant?: boolean;
      use_analytics?: boolean;
      manage_ai_settings?: boolean;
    };
    communication?: {
      send_messages?: boolean;
      create_rooms?: boolean;
      moderate_chat?: boolean;
      send_notifications?: boolean;
    };
    financial?: {
      view_payments?: boolean;
      process_refunds?: boolean;
      view_reports?: boolean;
      manage_subscriptions?: boolean;
    };
    system?: {
      view_logs?: boolean;
      manage_backups?: boolean;
      system_settings?: boolean;
      security_settings?: boolean;
    };
  };
  constraints?: {
    maxUsers?: number;
    maxContent?: number;
    maxStorage?: number;
    allowedFileTypes?: string[];
    maxFileSize?: number;
    sessionTimeout?: number;
    aiDailyLimit?: number;
  };
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  parentRoleId?: string;
  permissions?: {
    users?: {
      view?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
      bulk_operations?: boolean;
    };
    content?: {
      view?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
      approve?: boolean;
      publish?: boolean;
    };
    lessons?: {
      view?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
      assign?: boolean;
      grade?: boolean;
    };
    analytics?: {
      view?: boolean;
      export?: boolean;
      custom_reports?: boolean;
      system_analytics?: boolean;
    };
    organization?: {
      view_settings?: boolean;
      edit_settings?: boolean;
      manage_billing?: boolean;
      manage_branding?: boolean;
      manage_integrations?: boolean;
    };
    roles?: {
      view?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
      assign?: boolean;
    };
    ai?: {
      use_content_generation?: boolean;
      use_learning_assistant?: boolean;
      use_analytics?: boolean;
      manage_ai_settings?: boolean;
    };
    communication?: {
      send_messages?: boolean;
      create_rooms?: boolean;
      moderate_chat?: boolean;
      send_notifications?: boolean;
    };
    financial?: {
      view_payments?: boolean;
      process_refunds?: boolean;
      view_reports?: boolean;
      manage_subscriptions?: boolean;
    };
    system?: {
      view_logs?: boolean;
      manage_backups?: boolean;
      system_settings?: boolean;
      security_settings?: boolean;
    };
  };
  constraints?: {
    maxUsers?: number;
    maxContent?: number;
    maxStorage?: number;
    allowedFileTypes?: string[];
    maxFileSize?: number;
    sessionTimeout?: number;
    aiDailyLimit?: number;
  };
  isActive?: boolean;
  priority?: number;
}

export interface AssignRoleRequest {
  targetUserId: string;
  roleId: string;
}

export interface RoleHierarchy {
  _id: string;
  name: string;
  type: string;
  priority: number;
  isActive: boolean;
  children: RoleHierarchy[];
}

export interface RolePermissions {
  role: {
    id: string;
    name: string;
    type: string;
    isDefault: boolean;
  };
  permissions: {
    users: Record<string, boolean>;
    content: Record<string, boolean>;
    lessons: Record<string, boolean>;
    analytics: Record<string, boolean>;
    organization: Record<string, boolean>;
    roles: Record<string, boolean>;
    ai: Record<string, boolean>;
    communication: Record<string, boolean>;
    financial: Record<string, boolean>;
    system: Record<string, boolean>;
  };
  effectivePermissions: string[];
  constraints: {
    maxUsers?: number;
    maxContent?: number;
    maxStorage?: number;
    allowedFileTypes?: string[];
    maxFileSize?: number;
    sessionTimeout?: number;
    aiDailyLimit?: number;
  };
}

export interface BulkRoleOperationRequest {
  operation: 'activate' | 'deactivate' | 'update_permissions';
  roleIds: string[];
  data?: {
    permissions?: {
      users?: Record<string, boolean>;
      content?: Record<string, boolean>;
      lessons?: Record<string, boolean>;
      analytics?: Record<string, boolean>;
      organization?: Record<string, boolean>;
      roles?: Record<string, boolean>;
      ai?: Record<string, boolean>;
      communication?: Record<string, boolean>;
      financial?: Record<string, boolean>;
      system?: Record<string, boolean>;
    };
  };
}

export interface RoleFilters {
  type?: 'system' | 'custom' | 'inherited';
  isActive?: boolean;
  search?: string;
}

export interface RoleResponse {
  success: boolean;
  data: Role;
  message?: string;
}

export interface RoleListResponse {
  success: boolean;
  data: Role[];
}

export interface RoleHierarchyResponse {
  success: boolean;
  data: RoleHierarchy[];
}

export interface RolePermissionsResponse {
  success: boolean;
  data: RolePermissions;
}

export interface BulkRoleOperationResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}