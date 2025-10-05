# Admin Setup Guide

This guide explains how to set up and manage admin users for the Verbfy platform.

## Creating an Admin User

### Method 1: Using npm script (Recommended)

```bash
# Using TypeScript version (recommended)
npm run create-admin

# Using JavaScript version
npm run create-admin:js
```

### Method 2: Using environment variables

Set the following environment variables and run the script:

```bash
# Set environment variables
export ADMIN_EMAIL="admin@verbfy.com"
export ADMIN_PASSWORD="SecurePassword123!"
export ADMIN_NAME="System Administrator"

# Run the script
npm run create-admin
```

### Method 3: Direct execution

```bash
# TypeScript version
npx ts-node scripts/createAdminUser.ts

# JavaScript version
node scripts/createAdminUser.js
```

## Password Requirements

Admin passwords must meet the following criteria:
- At least 8 characters long
- Contains at least one uppercase letter
- Contains at least one lowercase letter
- Contains at least one number
- Contains at least one special character (@$!%*?&)

## Admin Login

Once an admin user is created, you can log in through:

### API Endpoints

- **Login**: `POST /api/admin/login`
- **Logout**: `POST /api/admin/logout`
- **Profile**: `GET /api/admin/me`

### Example Login Request

```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@verbfy.com",
    "password": "SecurePassword123!"
  }'
```

### Frontend Access

Navigate to: `http://localhost:3000/admin/login`

## Security Features

### Rate Limiting
- **Login attempts**: 5 attempts per 15 minutes per IP
- **API requests**: 100 requests per 15 minutes per IP
- **Password reset**: 3 attempts per hour per IP

### Authentication
- JWT tokens with admin role verification
- Secure HTTP-only cookies
- CSRF protection
- Session management

### Logging
All admin activities are logged including:
- Login attempts (successful and failed)
- API access
- Rate limit violations
- Security events

## Environment Variables

Required environment variables for admin functionality:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/verbfy

# JWT
JWT_SECRET=your-super-secure-jwt-secret

# Admin user creation (optional)
ADMIN_EMAIL=admin@verbfy.com
ADMIN_PASSWORD=SecurePassword123!
ADMIN_NAME=System Administrator

# Security
NODE_ENV=production  # Use 'development' for local testing
```

## Troubleshooting

### Common Issues

1. **"Admin user already exists"**
   - The script will prompt to update the password or promote existing user
   - Choose 'y' to update or 'N' to skip

2. **"Invalid email format"**
   - Ensure the email follows standard format: user@domain.com

3. **"Password does not meet requirements"**
   - Check password meets all security criteria listed above

4. **"Database connection failed"**
   - Verify MONGODB_URI is correct
   - Ensure MongoDB is running
   - Check network connectivity

5. **"Permission denied"**
   - Ensure the script has execution permissions
   - Run with appropriate user privileges

### Logs

Check application logs for detailed error information:

```bash
# View recent logs
npm run logs:pm2

# Monitor logs in real-time
pm2 logs verbfy-backend --lines 100
```

## Production Deployment

### 1. Create Admin User During Deployment

Add to your deployment script:

```bash
# Set admin credentials
export ADMIN_EMAIL="admin@yourdomain.com"
export ADMIN_PASSWORD="$(openssl rand -base64 32)"
export ADMIN_NAME="Platform Administrator"

# Create admin user
npm run create-admin
```

### 2. Secure the Admin Credentials

- Store admin credentials in a secure password manager
- Use environment variables for automated deployments
- Rotate admin passwords regularly
- Enable 2FA if implemented

### 3. Monitor Admin Access

- Set up alerts for admin login attempts
- Monitor admin API usage
- Review admin activity logs regularly
- Implement IP whitelisting if needed

## API Documentation

### Admin Authentication Endpoints

#### POST /api/admin/login
Login an admin user.

**Request Body:**
```json
{
  "email": "admin@verbfy.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "user": {
    "id": "user_id",
    "name": "System Administrator",
    "email": "admin@verbfy.com",
    "role": "admin"
  }
}
```

#### POST /api/admin/logout
Logout the current admin user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Admin logout successful"
}
```

#### GET /api/admin/me
Get current admin user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "System Administrator",
    "email": "admin@verbfy.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Next Steps

After creating an admin user:

1. Test admin login through the API
2. Access the admin dashboard (when implemented)
3. Configure additional admin users if needed
4. Set up monitoring and alerting
5. Review and update security policies

For additional help, refer to the main project documentation or contact the development team.