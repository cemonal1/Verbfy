import { Router } from 'express';
import { RoleController } from '../controllers/roleController';
import { auth } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = Router();

// Create new role (authenticated, admin only)
router.post('/:organizationId', auth, idempotencyMiddleware, RoleController.createRole);

// Get all roles for organization (authenticated)
router.get('/:organizationId', auth, RoleController.getRoles);

// Get role by ID (authenticated)
router.get('/role/:roleId', auth, RoleController.getRole);

// Update role (authenticated, admin only)
router.put('/:roleId', auth, idempotencyMiddleware, RoleController.updateRole);

// Delete role (authenticated, admin only)
router.delete('/:roleId', auth, idempotencyMiddleware, RoleController.deleteRole);

// Assign role to user (authenticated, admin only)
router.post('/:organizationId/assign', auth, idempotencyMiddleware, RoleController.assignRole);

// Get role hierarchy (authenticated)
router.get('/:organizationId/hierarchy', auth, RoleController.getRoleHierarchy);

// Get role permissions (authenticated)
router.get('/:roleId/permissions', auth, RoleController.getRolePermissions);

// Bulk role operations (authenticated, admin only)
router.post('/:organizationId/bulk', auth, idempotencyMiddleware, RoleController.bulkRoleOperations);

export default router; 