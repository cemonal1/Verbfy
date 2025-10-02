import { Request, Response } from 'express';
import Organization from '../models/Organization';
import Role from '../models/Role';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export class OrganizationController {
  // Create new organization
  static async createOrganization(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const {
        name,
        type,
        contact,
        branding,
        subscription,
        settings
      } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
      }

      // Validate required fields
      if (!name || !type || !contact?.email) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: name, type, contact.email'
        });
      return;
      }

      // Generate unique slug
      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      let slug = baseSlug;
      let counter = 1;

      while (await Organization.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create organization
      const organization = new Organization({
        name,
        slug,
        type,
        contact,
        branding: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1F2937',
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          ...branding
        },
        subscription: {
          plan: 'free',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          maxUsers: 10,
          maxStorage: 1,
          features: ['basic_features'],
          billingCycle: 'monthly',
          ...subscription
        },
        settings: {
          allowUserRegistration: true,
          requireEmailVerification: true,
          requireAdminApproval: false,
          allowFileUploads: true,
          maxFileSize: 10,
          allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
          sessionTimeout: 480,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false
          },
          aiFeatures: {
            enabled: true,
            dailyLimit: 100,
            modelAccess: ['gpt-3.5-turbo']
          },
          ...settings
        },
        admins: [{
          userId: new mongoose.Types.ObjectId(userId),
          role: 'owner',
          permissions: ['*'],
          addedAt: new Date(),
          addedBy: new mongoose.Types.ObjectId(userId)
        }]
      });

      await organization.save();

      // Create default roles for the organization
      await Role.createDefaultRoles(organization._id.toString(), userId);

      // Update user to belong to this organization
      await User.findByIdAndUpdate(userId, {
        organizationId: organization._id,
        role: 'owner'
      });

      res.status(201).json({
        success: true,
        data: organization,
        message: 'Organization created successfully'
      });
    } catch (error) {
      console.error('Error creating organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create organization'
      });
    }
  }

  // Get organization details
  static async getOrganization(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
      return;
      }

      const orgId = organizationId || user.organizationId;
      if (!orgId) {
        res.status(404).json({ success: false, message: 'No organization found' });
      return;
      }

      const organization = await Organization.findById(orgId)
        .populate('admins.userId', 'name email');

      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
      return;
      }

      // Check if user has access to this organization
      const isAdmin = organization.admins.some(admin => admin.userId.toString() === userId);
      if (!isAdmin && user.organizationId?.toString() !== orgId) {
        res.status(403).json({ success: false, message: 'Access denied' });
      return;
      }

      res.json({
        success: true,
        data: organization
      });
    } catch (error) {
      console.error('Error getting organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get organization'
      });
    }
  }

  // Update organization
  static async updateOrganization(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;
      const updateData = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
      return;
      }

      // Check if user is admin of this organization
      const admin = organization.admins.find(admin => admin.userId.toString() === userId);
      if (!admin) {
        res.status(403).json({ success: false, message: 'Access denied' });
      return;
      }

      // Check permissions based on admin role
      const canUpdateSettings = admin.role === 'owner' || admin.permissions.includes('organization.edit_settings');
      const canUpdateBranding = admin.role === 'owner' || admin.permissions.includes('organization.manage_branding');
      const canUpdateBilling = admin.role === 'owner' || admin.permissions.includes('organization.manage_billing');

      // Filter update data based on permissions
      const allowedUpdates: any = {};
      
      if (canUpdateSettings && updateData.settings) {
        allowedUpdates.settings = updateData.settings;
      }
      
      if (canUpdateBranding && updateData.branding) {
        allowedUpdates.branding = updateData.branding;
      }
      
      if (canUpdateBilling && updateData.subscription) {
        allowedUpdates.subscription = updateData.subscription;
      }
      
      if (updateData.contact) {
        allowedUpdates.contact = updateData.contact;
      }

      if (Object.keys(allowedUpdates).length === 0) {
        res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
      }

      const updatedOrganization = await Organization.findByIdAndUpdate(
        organizationId,
        { ...allowedUpdates, updatedAt: new Date() },
        { new: true }
      ).populate('admins.userId', 'name email');

      res.json({
        success: true,
        data: updatedOrganization,
        message: 'Organization updated successfully'
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update organization'
      });
    }
  }

  // Get organization statistics
  static async getOrganizationStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
      return;
      }

      const orgId = organizationId || user.organizationId;
      if (!orgId) {
        res.status(404).json({ success: false, message: 'No organization found' });
      return;
      }

      // Check permissions
      const organization = await Organization.findById(orgId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
      return;
      }

      const isAdmin = organization.admins.some(admin => admin.userId.toString() === userId);
      if (!isAdmin && user.organizationId?.toString() !== orgId) {
        res.status(403).json({ success: false, message: 'Access denied' });
      return;
      }

      // Get statistics
      const userCount = await User.countDocuments({ organizationId: orgId });
      const activeUserCount = await User.countDocuments({ 
        organizationId: orgId, 
        lastActiveAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Active in last 7 days
      });

      // Get content statistics (you'll need to implement these based on your content models)
      const contentStats = {
        totalLessons: 0,
        totalMaterials: 0,
        totalContent: 0
      };

      // Calculate storage usage
      const storageUsed = organization.statistics.storageUsed;

      const stats = {
        users: {
          total: userCount,
          active: activeUserCount,
          new: organization.statistics.totalUsers - userCount + activeUserCount,
          churn: 0 // Calculate based on your business logic
        },
        content: {
          total: contentStats.totalContent,
          created: organization.statistics.totalContent,
          accessed: 0 // Calculate based on your access logs
        },
        storage: {
          used: storageUsed,
          limit: organization.subscription.maxStorage,
          usagePercentage: (storageUsed / organization.subscription.maxStorage) * 100
        },
        subscription: {
          plan: organization.subscription.plan,
          status: organization.subscription.status,
          nextBilling: organization.subscription.nextBillingDate,
          features: organization.subscription.features
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting organization stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get organization statistics'
      });
    }
  }

  // Manage organization admins
  static async manageAdmins(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;
      const { action, adminUserId, role, permissions } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
      return;
      }

      // Check if user is owner or has admin management permissions
      const currentAdmin = organization.admins.find(admin => admin.userId.toString() === userId);
      if (!currentAdmin || (currentAdmin.role !== 'owner' && !currentAdmin.permissions.includes('roles.assign'))) {
        res.status(403).json({ success: false, message: 'Access denied' });
      return;
      }

      switch (action) {
        case 'add':
          if (!adminUserId || !role) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
          }

          // Check if user exists and belongs to organization
          const userToAdd = await User.findOne({ _id: adminUserId, organizationId });
          if (!userToAdd) {
            res.status(404).json({ success: false, message: 'User not found in organization' });
      return;
          }

          // Check if already admin
          const existingAdmin = organization.admins.find(admin => admin.userId.toString() === adminUserId);
          if (existingAdmin) {
            res.status(400).json({ success: false, message: 'User is already an admin' });
      return;
          }

          organization.admins.push({
            userId: adminUserId,
            role,
            permissions: permissions || [],
            addedAt: new Date(),
            addedBy: new mongoose.Types.ObjectId(userId)
          });

          break;

        case 'update':
          if (!adminUserId || !role) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
          }

          const adminToUpdate = organization.admins.find(admin => admin.userId.toString() === adminUserId);
          if (!adminToUpdate) {
            res.status(404).json({ success: false, message: 'Admin not found' });
      return;
          }

          // Only owner can update other owners
          if (adminToUpdate.role === 'owner' && currentAdmin.role !== 'owner') {
            res.status(403).json({ success: false, message: 'Only owner can update other owners' });
      return;
          }

          adminToUpdate.role = role;
          if (permissions) {
            adminToUpdate.permissions = permissions;
          }

          break;

        case 'remove':
          if (!adminUserId) {
            res.status(400).json({ success: false, message: 'Missing admin user ID' });
      return;
          }

          const adminToRemove = organization.admins.find(admin => admin.userId.toString() === adminUserId);
          if (!adminToRemove) {
            res.status(404).json({ success: false, message: 'Admin not found' });
      return;
          }

          // Cannot remove owner
          if (adminToRemove.role === 'owner') {
            res.status(400).json({ success: false, message: 'Cannot remove owner' });
      return;
          }

          // Cannot remove yourself unless you're owner
          if (adminToRemove.userId.toString() === userId && currentAdmin.role !== 'owner') {
            res.status(400).json({ success: false, message: 'Cannot remove yourself' });
      return;
          }

          organization.admins = organization.admins.filter(admin => admin.userId.toString() !== adminUserId);

          break;

        default:
          res.status(400).json({ success: false, message: 'Invalid action' });
      return;
      }

      await organization.save();

      const updatedOrganization = await Organization.findById(organizationId)
        .populate('admins.userId', 'name email');

      res.json({
        success: true,
        data: updatedOrganization,
        message: `Admin ${action}ed successfully`
      });
    } catch (error) {
      console.error('Error managing admins:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to manage admins'
      });
    }
  }

  // Get organization users
  static async getOrganizationUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;
      const { page = 1, limit = 20, role, status, search } = req.query;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
      return;
      }

      const orgId = organizationId || user.organizationId;
      if (!orgId) {
        res.status(404).json({ success: false, message: 'No organization found' });
      return;
      }

      // Check permissions
      const organization = await Organization.findById(orgId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
      return;
      }

      const isAdmin = organization.admins.some(admin => admin.userId.toString() === userId);
      if (!isAdmin && user.organizationId?.toString() !== orgId) {
        res.status(403).json({ success: false, message: 'Access denied' });
      return;
      }

      // Build query
      const query: any = { organizationId: orgId };
      if (role) query.role = role;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting organization users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get organization users'
      });
    }
  }

  // Bulk operations
  static async bulkOperations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;
      const { operation, userIds, data } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) {
        res.status(404).json({ success: false, message: 'Organization not found' });
      return;
      }

      // Check if user has bulk operations permission
      const admin = organization.admins.find(admin => admin.userId.toString() === userId);
      if (!admin || (!admin.permissions.includes('users.bulk_operations') && admin.role !== 'owner')) {
        res.status(403).json({ success: false, message: 'Access denied' });
      return;
      }

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({ success: false, message: 'User IDs required' });
      return;
      }

      let result;
      switch (operation) {
        case 'update_role':
          if (!data.role) {
            res.status(400).json({ success: false, message: 'Role required' });
      return;
          }
          result = await User.updateMany(
            { _id: { $in: userIds }, organizationId },
            { role: data.role }
          );
          break;

        case 'update_status':
          if (!data.status) {
            res.status(400).json({ success: false, message: 'Status required' });
      return;
          }
          result = await User.updateMany(
            { _id: { $in: userIds }, organizationId },
            { status: data.status }
          );
          break;

        case 'delete':
          result = await User.deleteMany({ _id: { $in: userIds }, organizationId });
          break;

        default:
          res.status(400).json({ success: false, message: 'Invalid operation' });
      return;
      }

      res.json({
        success: true,
        data: result,
        message: `Bulk operation '${operation}' completed successfully`
      });
    } catch (error) {
      console.error('Error performing bulk operations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk operations'
      });
    }
  }
} 