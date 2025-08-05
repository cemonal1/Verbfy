import { Router } from 'express';
import { RoleController } from '../controllers/roleController';
import { auth } from '../middleware/auth';

const router = Router();

// Create new role (authenticated, admin only)
router.post('/:organizationId', auth, RoleController.createRole);

// Get all roles for organization (authenticated)
router.get('/:organizationId', auth, RoleController.getRoles);

// Get role by ID (authenticated)
router.get('/role/:roleId', auth, RoleController.getRole);

// Update role (authenticated, admin only)
router.put('/:roleId', auth, RoleController.updateRole);

// Delete role (authenticated, admin only)
router.delete('/:roleId', auth, RoleController.deleteRole);

// Assign role to user (authenticated, admin only)
router.post('/:organizationId/assign', auth, RoleController.assignRole);

// Get role hierarchy (authenticated)
router.get('/:organizationId/hierarchy', auth, RoleController.getRoleHierarchy);

// Get role permissions (authenticated)
router.get('/:roleId/permissions', auth, RoleController.getRolePermissions);

// Bulk role operations (authenticated, admin only)
router.post('/:organizationId/bulk', auth, RoleController.bulkRoleOperations);

export default router; 