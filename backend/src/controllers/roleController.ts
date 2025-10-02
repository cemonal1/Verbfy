import { Request, Response } from 'express';
import Role from '../models/Role';
import User from '../models/User';
import Organization from '../models/Organization';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

export class RoleController {
  // Create new role
  static async createRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;
      const {
        name,
        description,
        type,
        parentRoleId,
        permissions,
        constraints
      } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      // Validate required fields
      if (!name || !organizationId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: name, organizationId'
        });
        return;
      }

      // Check if user has permission to create roles
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
        return;
      }

      const admin = organization.admins.find(admin => admin.userId.toString() === userId);
      if (!admin || (!admin.permissions.includes('roles.create') && admin.role !== 'owner')) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      // Check if role name already exists in organization
      const existingRole = await Role.findOne({ organizationId, name });
      if (existingRole) {
        res.status(400).json({ success: false, message: 'Role name already exists' });
        return;
      }

      // Validate parent role if provided
      if (parentRoleId) {
        const parentRole = await Role.findOne({ _id: parentRoleId, organizationId });
        if (!parentRole) {
          res.status(400).json({ success: false, message: 'Parent role not found' });
          return;
        }
      }

      // Create role
      const role = new Role({
        organizationId,
        name,
        description,
        type: type || 'custom',
        parentRoleId,
        permissions: permissions || {},
        constraints: constraints || {},
        createdBy: userId,
        updatedBy: userId
      });

      await role.save();

      res.status(201).json({
        success: true,
        data: role,
        message: 'Role created successfully'
      });
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create role'
      });
    }
  }

  // Get all roles for organization
  static async getRoles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;
      const { type, isActive } = req.query;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      // Check if user has access to organization
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
        return;
      }

      const admin = organization.admins.find(admin => admin.userId.toString() === userId);
      const user = await User.findById(userId);
      
      if (!admin && user?.organizationId?.toString() !== organizationId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      // Build query
      const query: any = { organizationId };
      if (type) query.type = type;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const roles = await Role.find(query)
        .populate('parentRoleId', 'name')
        .sort({ priority: -1, name: 1 });

      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('Error getting roles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get roles'
      });
    }
  }

  // Get role by ID
  static async getRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { roleId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const role = await Role.findById(roleId)
        .populate('parentRoleId', 'name permissions')
        .populate('organizationId', 'name');

      if (!role) {
        res.status(404).json({ success: false, message: 'Role not found' });
        return;
      }

      // Check if user has access to this role's organization
      const organization = await Organization.findById(role.organizationId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
        return;
      }

      const admin = organization.admins.find(admin => admin.userId.toString() === userId);
      const user = await User.findById(userId);
      
      if (!admin && user?.organizationId?.toString() !== role.organizationId.toString()) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      res.json({
        success: true,
        data: role
      });
    } catch (error) {
      console.error('Error getting role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get role'
      });
    }
  }

  // Update role
  static async updateRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { roleId } = req.params;
      const updateData = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const role = await Role.findById(roleId);
      if (!role) {
        res.status(404).json({ success: false, message: 'Role not found' });
        return;
      }

      // Check if user has permission to update roles
      const organization = await Organization.findById(role.organizationId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
        return;
      }

      const admin = organization.admins.find(admin => admin.userId.toString() === userId);
      if (!admin || (!admin.permissions.includes('roles.edit') && admin.role !== 'owner')) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      // Cannot update system roles unless owner
      if (role.type === 'system' && admin.role !== 'owner') {
        res.status(403).json({ success: false, message: 'Cannot update system roles' });
        return;
      }

      // Check if role name already exists (if name is being updated)
      if (updateData.name && updateData.name !== role.name) {
        const existingRole = await Role.findOne({ 
          organizationId: role.organizationId, 
          name: updateData.name,
          _id: { $ne: roleId }
        });
        if (existingRole) {
          res.status(400).json({ success: false, message: 'Role name already exists' });
        return;
        }
      }

      // Validate parent role if being updated
      if (updateData.parentRoleId && updateData.parentRoleId !== role.parentRoleId?.toString()) {
        const parentRole = await Role.findOne({ 
          _id: updateData.parentRoleId, 
          organizationId: role.organizationId 
        });
        if (!parentRole) {
          res.status(400).json({ success: false, message: 'Parent role not found' });
        return;
        }

        // Check for circular references
        if (updateData.parentRoleId === roleId) {
          res.status(400).json({ success: false, message: 'Cannot set role as its own parent' });
        return;
        }
      }

      // Update role
      const updatedRole = await Role.findByIdAndUpdate(
        roleId,
        { ...updateData, updatedBy: userId },
        { new: true }
      ).populate('parentRoleId', 'name');

      res.json({
        success: true,
        data: updatedRole,
        message: 'Role updated successfully'
      });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update role'
      });
    }
  }

  // Delete role
  static async deleteRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { roleId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const role = await Role.findById(roleId);
      if (!role) {
        res.status(404).json({ success: false, message: 'Role not found' });
        return;
      }

      // Check if user has permission to delete roles
      const organization = await Organization.findById(role.organizationId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
        return;
      }

      const admin = organization.admins.find(admin => admin.userId.toString() === userId);
      if (!admin || (!admin.permissions.includes('roles.delete') && admin.role !== 'owner')) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      // Cannot delete system roles
      if (role.type === 'system') {
        res.status(400).json({ success: false, message: 'Cannot delete system roles' });
        return;
      }

      // Cannot delete default roles
      if (role.isDefault) {
        res.status(400).json({ success: false, message: 'Cannot delete default roles' });
        return;
      }

      // Check if role is being used by any users
      const usersWithRole = await User.countDocuments({ 
        organizationId: role.organizationId,
        role: role.name
      });

      if (usersWithRole > 0) {
        res.status(400).json({ 
          success: false, 
          message: `Cannot delete role. ${usersWithRole} user(s) are currently assigned this role.`
        });
        return;
      }

      // Check if role has child roles
      const childRoles = await Role.countDocuments({ parentRoleId: roleId });
      if (childRoles > 0) {
        res.status(400).json({ 
          success: false, 
          message: `Cannot delete role. ${childRoles} child role(s) depend on this role.`
        });
        return;
      }

      await Role.findByIdAndDelete(roleId);

      res.json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete role'
      });
    }
  }

  // Assign role to user
  static async assignRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;
      const { targetUserId, roleId } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      if (!targetUserId || !roleId) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      // Check if user has permission to assign roles
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
        return;
      }

      const admin = organization.admins.find(admin => admin.userId.toString() === userId);
      if (!admin || (!admin.permissions.includes('roles.assign') && admin.role !== 'owner')) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      // Check if target user exists and belongs to organization
      const targetUser = await User.findOne({ _id: targetUserId, organizationId });
      if (!targetUser) {
        res.status(404).json({ success: false, message: 'Target user not found' });
        return;
      }

      // Check if role exists and belongs to organization
      const role = await Role.findOne({ _id: roleId, organizationId });
      if (!role) {
        res.status(404).json({ success: false, message: 'Role not found' });
        return;
      }

      // Update user's role
      await User.findByIdAndUpdate(targetUserId, { role: role.name });

      res.json({
        success: true,
        message: `Role '${role.name}' assigned to user successfully`
      });
    } catch (error) {
      console.error('Error assigning role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign role'
      });
    }
  }

  // Get role hierarchy
  static async getRoleHierarchy(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      // Check if user has access to organization
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
        return;
      }

      const admin = organization.admins.find(admin => admin.userId.toString() === userId);
      const user = await User.findById(userId);
      
      if (!admin && user?.organizationId?.toString() !== organizationId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      // Get all roles for organization
      const roles = await Role.find({ organizationId, isActive: true })
        .sort({ priority: -1, name: 1 });

      // Build hierarchy
      const buildHierarchy = (parentId: string | null = null): any[] => {
        return roles
          .filter(role => role.parentRoleId?.toString() === parentId)
          .map(role => ({
            ...role.toObject(),
            children: buildHierarchy(role._id.toString())
          }));
      };

      const hierarchy = buildHierarchy();

      res.json({
        success: true,
        data: hierarchy
      });
    } catch (error) {
      console.error('Error getting role hierarchy:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get role hierarchy'
      });
    }
  }

  // Get role permissions
  static async getRolePermissions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { roleId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const role = await Role.findById(roleId);
      if (!role) {
        res.status(404).json({ success: false, message: 'Role not found' });
        return;
      }

      // Check if user has access to this role's organization
      const organization = await Organization.findById(role.organizationId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
        return;
      }

      const admin = organization.admins.find(admin => admin.userId.toString() === userId);
      const user = await User.findById(userId);
      
      if (!admin && user?.organizationId?.toString() !== role.organizationId.toString()) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      // Get effective permissions (including inherited)
      const effectivePermissions = (role as any).getAllPermissions();

      res.json({
        success: true,
        data: {
          role: {
            id: role._id,
            name: role.name,
            type: role.type,
            isDefault: role.isDefault
          },
          permissions: role.permissions,
          effectivePermissions,
          constraints: role.constraints
        }
      });
    } catch (error) {
      console.error('Error getting role permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get role permissions'
      });
    }
  }

  // Bulk role operations
  static async bulkRoleOperations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;
      const { operation, roleIds, data } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      // Check if user has permission
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
        return;
      }

      const admin = organization.admins.find(admin => admin.userId.toString() === userId);
      if (!admin || (!admin.permissions.includes('roles.edit') && admin.role !== 'owner')) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
        res.status(400).json({ success: false, message: 'Role IDs required' });
        return;
      }

      let result;
      switch (operation) {
        case 'activate':
          result = await Role.updateMany(
            { _id: { $in: roleIds }, organizationId },
            { isActive: true }
          );
          break;

        case 'deactivate':
          result = await Role.updateMany(
            { _id: { $in: roleIds }, organizationId },
            { isActive: false }
          );
          break;

        case 'update_permissions':
          if (!data.permissions) {
            res.status(400).json({ success: false, message: 'Permissions required' });
        return;
          }
          result = await Role.updateMany(
            { _id: { $in: roleIds }, organizationId, type: { $ne: 'system' } },
            { permissions: data.permissions }
          );
          break;

        default:
          res.status(400).json({ success: false, message: 'Invalid operation' });
        return;
      }

      res.json({
        success: true,
        data: result,
        message: `Bulk role operation '${operation}' completed successfully`
      });
    } catch (error) {
      console.error('Error performing bulk role operations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk role operations'
      });
    }
  }
}