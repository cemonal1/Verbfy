import { Router } from 'express';
import { OrganizationController } from '../controllers/organizationController';
import { auth } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = Router();

// Create new organization (authenticated)
router.post('/', auth, idempotencyMiddleware, OrganizationController.createOrganization);

// Get organization details (authenticated)
router.get('/:organizationId?', auth, OrganizationController.getOrganization);

// Update organization (authenticated, admin only)
router.put('/:organizationId', auth, idempotencyMiddleware, OrganizationController.updateOrganization);

// Get organization statistics (authenticated, admin only)
router.get('/:organizationId/stats', auth, OrganizationController.getOrganizationStats);

// Manage organization admins (authenticated, admin only)
router.post('/:organizationId/admins', auth, idempotencyMiddleware, OrganizationController.manageAdmins);

// Get organization users (authenticated, admin only)
router.get('/:organizationId/users', auth, OrganizationController.getOrganizationUsers);

// Bulk operations (authenticated, admin only)
router.post('/:organizationId/bulk', auth, idempotencyMiddleware, OrganizationController.bulkOperations);

export default router; 