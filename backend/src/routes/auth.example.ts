/**
 * Example OpenAPI/Swagger JSDoc Annotations for Route Documentation
 *
 * This file shows how to document API endpoints using JSDoc comments.
 * Copy these patterns to your actual route files.
 *
 * The swagger-jsdoc library automatically generates OpenAPI specification
 * from these JSDoc comments.
 */

import express from 'express';
const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password, returns JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/login', (req, res) => {
  // Implementation here
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     description: Create a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePassword123!
 *               role:
 *                 type: string
 *                 enum: [student, teacher]
 *                 example: student
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Registration successful. Please check your email to verify your account.
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', (req, res) => {
  // Implementation here
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', (req, res) => {
  // Implementation here
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Invalidate the current JWT token (blacklist it)
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', (req, res) => {
  // Implementation here
});

/**
 * @swagger
 * /api/lessons:
 *   get:
 *     summary: List all lessons
 *     description: Get a paginated list of lessons for the authenticated user
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, active, completed, cancelled]
 *         description: Filter by lesson status
 *     responses:
 *       200:
 *         description: Lessons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     lessons:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Lesson'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 42
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         pages:
 *                           type: integer
 *                           example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/lessons', (req, res) => {
  // Implementation here
});

/**
 * @swagger
 * /api/lessons/{id}:
 *   get:
 *     summary: Get lesson by ID
 *     description: Retrieve detailed information about a specific lesson
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID (MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Lesson retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Lesson'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/lessons/:id', (req, res) => {
  // Implementation here
});

export default router;

/*
 * ========================================
 * DOCUMENTATION GUIDELINES
 * ========================================
 *
 * 1. Always include @swagger at the top of each endpoint documentation
 * 2. Specify the full path (e.g., /api/auth/login)
 * 3. Include HTTP method (get, post, put, patch, delete)
 * 4. Add summary and description
 * 5. Tag endpoints for organization (Authentication, Lessons, etc.)
 * 6. Document all request parameters (path, query, body)
 * 7. Document all response codes (200, 400, 401, 404, 500)
 * 8. Use $ref to reference shared schemas
 * 9. Add security requirements for protected endpoints
 * 10. Include examples for request/response payloads
 *
 * ========================================
 * SECURITY SCHEMES
 * ========================================
 *
 * BearerAuth:
 *   To use protected endpoints, obtain a JWT token from /api/auth/login
 *   and include it in the Authorization header:
 *   Authorization: Bearer <your-jwt-token>
 *
 * ========================================
 * COMMON SCHEMAS
 * ========================================
 *
 * $ref: '#/components/schemas/User'         - User object
 * $ref: '#/components/schemas/Lesson'       - Lesson object
 * $ref: '#/components/schemas/Error'        - Error response
 * $ref: '#/components/schemas/Success'      - Success response
 *
 * ========================================
 * COMMON RESPONSES
 * ========================================
 *
 * $ref: '#/components/responses/UnauthorizedError'  - 401 Unauthorized
 * $ref: '#/components/responses/ForbiddenError'     - 403 Forbidden
 * $ref: '#/components/responses/NotFoundError'      - 404 Not Found
 * $ref: '#/components/responses/ValidationError'    - 400 Validation Error
 */
