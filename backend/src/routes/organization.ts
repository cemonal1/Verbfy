import { Router } from 'express';
import { OrganizationController } from '../controllers/organizationController';
import { auth } from '../middleware/auth';

const router = Router();

// Create new organization (authenticated)
router.post('/', auth, OrganizationController.createOrganization);

// Get organization details (authenticated)
router.get('/:organizationId?', auth, OrganizationController.getOrganization);

// Update organization (authenticated, admin only)
router.put('/:organizationId', auth, OrganizationController.updateOrganization);

// Get organization statistics (authenticated, admin only)
router.get('/:organizationId/stats', auth, OrganizationController.getOrganizationStats);

// Manage organization admins (authenticated, admin only)
router.post('/:organizationId/admins', auth, OrganizationController.manageAdmins);

// Get organization users (authenticated, admin only)
router.get('/:organizationId/users', auth, OrganizationController.getOrganizationUsers);

// Bulk operations (authenticated, admin only)
router.post('/:organizationId/bulk', auth, OrganizationController.bulkOperations);

export default router; 