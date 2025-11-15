# Verbfy API Documentation - Swagger/OpenAPI Guide

## Overview

The Verbfy API uses **Swagger/OpenAPI 3.0** for interactive API documentation. This allows developers to:
- Explore and test API endpoints interactively
- View request/response schemas
- Understand authentication requirements
- Generate client SDKs automatically

## Accessing the Documentation

### Development

```bash
# Start the backend server
cd backend
npm run dev

# Access Swagger UI
http://localhost:5000/api-docs

# Access raw OpenAPI specification (JSON)
http://localhost:5000/api-docs.json
```

### Production

```
# Swagger UI
https://api.verbfy.com/api-docs

# OpenAPI JSON
https://api.verbfy.com/api-docs.json
```

## Quick Start Guide

### 1. Access the Interactive UI

Open `http://localhost:5000/api-docs` in your browser to see the Swagger UI.

### 2. Authenticate

For protected endpoints:

1. Click **"Authorize"** button (top right)
2. Enter your JWT token in the format: `Bearer <your-jwt-token>`
3. Click **"Authorize"** then **"Close"**

To get a JWT token:
1. Use the `POST /api/auth/login` endpoint
2. Copy the `token` from the response
3. Use it for authentication

### 3. Test an Endpoint

1. Click on any endpoint to expand it
2. Click **"Try it out"**
3. Fill in required parameters
4. Click **"Execute"**
5. View the response below

## Adding Documentation to Endpoints

### Basic Structure

Use JSDoc comments with `@swagger` tag above route handlers:

```typescript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     summary: Short description
 *     description: Detailed description
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Success response
 */
router.get('/endpoint', handler);
```

### Complete Example

```typescript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password
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
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/login', loginController);
```

## Documentation Patterns

### GET Endpoint with Query Parameters

```typescript
/**
 * @swagger
 * /api/lessons:
 *   get:
 *     summary: List lessons
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, active, completed]
 *     responses:
 *       200:
 *         description: Success
 */
```

### POST Endpoint with Request Body

```typescript
/**
 * @swagger
 * /api/lessons:
 *   post:
 *     summary: Create lesson
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startTime
 *             properties:
 *               title:
 *                 type: string
 *                 example: English Conversation
 *               startTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Lesson created
 */
```

### PUT/PATCH Endpoint with Path Parameter

```typescript
/**
 * @swagger
 * /api/lessons/{id}:
 *   patch:
 *     summary: Update lesson
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [scheduled, cancelled]
 *     responses:
 *       200:
 *         description: Lesson updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### DELETE Endpoint

```typescript
/**
 * @swagger
 * /api/lessons/{id}:
 *   delete:
 *     summary: Delete lesson
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
```

## Available Tags

Organize endpoints by category using tags:

- `Authentication` - Login, register, logout, password reset
- `Users` - User profile and account management
- `Lessons` - Live video lesson management
- `Reservations` - Lesson booking system
- `Availability` - Teacher availability
- `Materials` - Learning materials
- `Chat` - Real-time messaging
- `Notifications` - User notifications
- `Payments` - Payment processing (Stripe)
- `Analytics` - Analytics and reporting
- `Admin` - Administrative endpoints
- `LiveKit` - Video/audio room management
- `VerbfyTalk` - P2P voice chat
- `Curriculum` - Personalized learning
- `CEFR Tests` - Language proficiency tests

## Shared Schemas

Reference common schemas using `$ref`:

```typescript
// User schema
$ref: '#/components/schemas/User'

// Lesson schema
$ref: '#/components/schemas/Lesson'

// Error response
$ref: '#/components/schemas/Error'

// Success response
$ref: '#/components/schemas/Success'
```

## Shared Responses

Reference common error responses:

```typescript
// 401 Unauthorized
$ref: '#/components/responses/UnauthorizedError'

// 403 Forbidden
$ref: '#/components/responses/ForbiddenError'

// 404 Not Found
$ref: '#/components/responses/NotFoundError'

// 400 Validation Error
$ref: '#/components/responses/ValidationError'
```

## Best Practices

### 1. Document All Endpoints

Every public endpoint should have Swagger documentation:

```typescript
// ❌ Bad - No documentation
router.get('/api/users', getUsers);

// ✅ Good - Documented
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     ...
 */
router.get('/api/users', getUsers);
```

### 2. Include Examples

Always provide example values:

```typescript
properties:
  email:
    type: string
    format: email
    example: john@example.com  // ✅ Example provided
  name:
    type: string
    example: John Doe  // ✅ Example provided
```

### 3. Document Error Responses

Include all possible error codes:

```typescript
responses:
  200:
    description: Success
  400:
    description: Validation error
  401:
    description: Unauthorized
  404:
    description: Not found
  500:
    description: Server error
```

### 4. Use Security Schemes

Mark protected endpoints with security requirements:

```typescript
security:
  - BearerAuth: []  // ✅ Requires JWT token
```

### 5. Document Request Validation

Show required fields and constraints:

```typescript
schema:
  type: object
  required:  // ✅ Mark required fields
    - email
    - password
  properties:
    email:
      type: string
      format: email
    password:
      type: string
      minLength: 8  // ✅ Show constraints
```

## Testing the Documentation

### Automated Tests

Test that Swagger documentation is valid:

```bash
# Check OpenAPI specification is valid
curl http://localhost:5000/api-docs.json | jq '.'

# Validate with swagger-cli
npx swagger-cli validate http://localhost:5000/api-docs.json
```

### Manual Testing

1. Start the server: `npm run dev`
2. Open Swagger UI: `http://localhost:5000/api-docs`
3. Test each endpoint using "Try it out"
4. Verify responses match documentation
5. Check authentication works correctly

## Generating Client SDKs

Use the OpenAPI specification to generate client SDKs:

### TypeScript/JavaScript

```bash
# Install generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:5000/api-docs.json \
  -g typescript-axios \
  -o ./clients/typescript

# Use in your app
import { DefaultApi } from './clients/typescript';
const api = new DefaultApi();
```

### Python

```bash
openapi-generator-cli generate \
  -i http://localhost:5000/api-docs.json \
  -g python \
  -o ./clients/python
```

### Other Languages

Supports 50+ languages:
- Java
- C#
- Ruby
- PHP
- Go
- Kotlin
- Swift
- And more...

## Exporting Documentation

### Export as JSON

```bash
curl http://localhost:5000/api-docs.json > openapi.json
```

### Export as YAML

```bash
npm install -g js-yaml
curl http://localhost:5000/api-docs.json | js-yaml > openapi.yaml
```

### Generate Static HTML

```bash
npm install -g redoc-cli
redoc-cli bundle http://localhost:5000/api-docs.json -o api-docs.html
```

## Configuration

Swagger configuration is in `/backend/src/config/swagger.ts`:

```typescript
// Update API info
info: {
  title: 'Verbfy API',
  version: '1.0.0',
  description: '...'
}

// Add/update servers
servers: [
  { url: 'http://localhost:5000', description: 'Dev' },
  { url: 'https://api.verbfy.com', description: 'Prod' }
]

// Add/update tags
tags: [
  { name: 'Authentication', description: '...' }
]
```

## Troubleshooting

### Documentation Not Showing

1. Check server is running: `http://localhost:5000/api-docs`
2. Verify Swagger setup in `src/index.ts`
3. Check JSDoc syntax is correct
4. Review console for errors

### Endpoint Not Appearing

1. Verify `@swagger` tag is present
2. Check route file is in `apis` array in `swagger.ts`
3. Restart the server
4. Clear browser cache

### Authentication Not Working

1. Get token from `/api/auth/login`
2. Click "Authorize" in Swagger UI
3. Enter: `Bearer <your-token>`
4. Try the endpoint again

## Examples Reference

See `/backend/src/routes/auth.example.ts` for complete examples of:
- GET endpoints with query parameters
- POST endpoints with request bodies
- PUT/PATCH endpoints with path parameters
- DELETE endpoints
- Authentication headers
- Error responses
- Pagination
- File uploads

## Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/docs/open-source-tools/swagger-ui/)
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)
- [OpenAPI Generator](https://openapi-generator.tech/)

## Support

For questions or issues:
1. Check the examples in `auth.example.ts`
2. Review this documentation
3. Validate your JSDoc syntax
4. Contact the API team
