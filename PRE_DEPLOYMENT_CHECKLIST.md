# 🚨 Pre-Deployment Checklist for Verbfy

## ⚠️ CRITICAL - Must Fix Before Deployment

### 1. **Security Issues (IMMEDIATE)**

#### 🔐 JWT Secret Fix
```bash
# File: backend/src/utils/jwt.ts
# REMOVE these hardcoded fallback secrets:
const SECRET = JWT_SECRET || 'dev-jwt-secret-not-for-production-use-this-only-for-development';
const REFRESH_SECRET = JWT_REFRESH_SECRET || 'dev-refresh-jwt-secret-not-for-production-use-this-only-for-development';

# REPLACE with:
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be defined in environment variables');
}
const SECRET = JWT_SECRET;
const REFRESH_SECRET = JWT_REFRESH_SECRET;
```

#### 🔑 Generate Secure Secrets
```bash
# Generate JWT secrets (run these commands and copy the output)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to backend/.env.production:
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
```

#### 🛡️ Environment Validation
```bash
# Create: backend/src/config/env.ts
export const validateEnvironment = () => {
  const required = [
    'MONGO_URI',
    'JWT_SECRET', 
    'JWT_REFRESH_SECRET',
    'FRONTEND_URL'
  ];
  
  for (const var_name of required) {
    if (!process.env[var_name]) {
      throw new Error(`Missing required environment variable: ${var_name}`);
    }
  }
};

# Add to backend/src/index.ts:
import { validateEnvironment } from './config/env';
validateEnvironment();
```

### 2. **Database Issues (IMMEDIATE)**

#### 📊 Add Critical Indexes
```bash
# Connect to MongoDB and run:
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });
db.reservations.createIndex({ "userId": 1 });
db.reservations.createIndex({ "date": 1 });
db.reservations.createIndex({ "status": 1 });
db.materials.createIndex({ "uploaderId": 1 });
db.materials.createIndex({ "status": 1 });
db.notifications.createIndex({ "recipient": 1 });
db.notifications.createIndex({ "isRead": 1 });
```

#### 🔄 Database Connection Optimization
```bash
# Update: backend/src/config/db.ts
export const connectDB = async () => {
  const maxRetries = 5;
  let attempt = 0;
  let delay = 1000;
  
  while (attempt < maxRetries) {
    try {
      await mongoose.connect(MONGO_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false
      });
      console.log('✅ MongoDB connected successfully');
      return;
    } catch (err) {
      attempt++;
      console.error(`❌ MongoDB connection failed (attempt ${attempt}/${maxRetries}):`, err);
      
      if (attempt >= maxRetries) {
        console.error('❌ Could not connect to MongoDB after maximum retries. Exiting.');
        process.exit(1);
      }
      
      console.log(`🔁 Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};
```

### 3. **Frontend Issues (IMMEDIATE)**

#### 🎯 Fix TypeScript Errors
```bash
# Run TypeScript check
cd verbfy-app
npx tsc --noEmit

# Fix any type errors found
# Common issues to check:
# - Missing type definitions in src/types/
# - Incorrect API response types
# - Missing props interfaces
```

#### 🛡️ Add Error Boundaries
```bash
# Ensure ErrorBoundary is used in _app.tsx
# File: verbfy-app/pages/_app.tsx
import ErrorBoundary from '@/components/shared/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <ChatProvider>
            <NotificationProvider>
              <AdminProvider>
                <Component {...pageProps} />
              </AdminProvider>
            </NotificationProvider>
          </ChatProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

### 4. **API Issues (IMMEDIATE)**

#### ✅ Add Request Validation
```bash
# Install validation library
cd backend
npm install joi

# Create: backend/src/middleware/validation.ts
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};
```

#### 🔄 Standardize Error Responses
```bash
# Update: backend/src/middleware/errorHandler.ts
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);
  
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = null;
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e: any) => e.message);
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not Found';
  } else if (err.status) {
    statusCode = err.status;
    message = err.message || message;
  }
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
```

## 🔧 HIGH PRIORITY - Fix Before Production

### 5. **Rate Limiting**
```bash
# Install rate limiting
cd backend
npm install express-rate-limit

# Create: backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later'
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### 6. **Security Headers**
```bash
# Install helmet
cd backend
npm install helmet

# Add to backend/src/index.ts:
import helmet from 'helmet';
app.use(helmet());
```

### 7. **Health Checks**
```bash
# Add to backend/src/index.ts:
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});
```

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] **Backend Environment** (`backend/.env.production`)
  - [ ] `MONGO_URI` configured
  - [ ] `JWT_SECRET` generated and set
  - [ ] `JWT_REFRESH_SECRET` generated and set
  - [ ] `FRONTEND_URL` set to production URL
  - [ ] `NODE_ENV=production`
  - [ ] `CORS_ORIGIN` set to production domain

- [ ] **Frontend Environment** (`verbfy-app/.env.production`)
  - [ ] `NEXT_PUBLIC_API_URL` set to production API URL
  - [ ] `NEXT_PUBLIC_LIVEKIT_URL` configured
  - [ ] `NODE_ENV=production`

### Security Checks
- [ ] **JWT Secrets** - Hardcoded fallback secrets removed
- [ ] **Environment Validation** - Required variables validated on startup
- [ ] **Rate Limiting** - Implemented on auth endpoints
- [ ] **Security Headers** - Helmet middleware added
- [ ] **CORS** - Properly configured for production domain

### Database Checks
- [ ] **Indexes** - Critical indexes added
- [ ] **Connection** - Connection pooling configured
- [ ] **Backup** - Backup strategy implemented
- [ ] **Validation** - Request validation added

### Application Checks
- [ ] **TypeScript** - No type errors (`npx tsc --noEmit`)
- [ ] **Error Boundaries** - Implemented in React app
- [ ] **Health Checks** - Health endpoint working
- [ ] **Logging** - Proper logging configured

### Testing
- [ ] **Unit Tests** - All tests passing
- [ ] **Integration Tests** - API endpoints tested
- [ ] **E2E Tests** - Critical user flows tested

### Performance
- [ ] **Bundle Size** - Frontend bundle optimized
- [ ] **Database Queries** - Queries optimized with indexes
- [ ] **Caching** - Caching strategy implemented

## 🚀 Deployment Commands

### 1. **Pre-Deployment Testing**
```bash
# Run all tests
cd backend && npm test
cd ../verbfy-app && npm test

# TypeScript check
cd backend && npx tsc --noEmit
cd ../verbfy-app && npx tsc --noEmit

# Build check
cd backend && npm run build
cd ../verbfy-app && npm run build
```

### 2. **Environment Validation**
```bash
# Validate environment files
node -e "
const fs = require('fs');
const path = require('path');

const backendEnv = fs.readFileSync('backend/.env.production', 'utf8');
const frontendEnv = fs.readFileSync('verbfy-app/.env.production', 'utf8');

const requiredBackend = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL'];
const requiredFrontend = ['NEXT_PUBLIC_API_URL', 'NODE_ENV'];

requiredBackend.forEach(var_name => {
  if (!backendEnv.includes(var_name + '=')) {
    throw new Error(\`Missing required backend env var: \${var_name}\`);
  }
});

requiredFrontend.forEach(var_name => {
  if (!frontendEnv.includes(var_name + '=')) {
    throw new Error(\`Missing required frontend env var: \${var_name}\`);
  }
});

console.log('✅ Environment validation passed');
"
```

### 3. **Deployment**
```bash
# Deploy to production
./deploy-production.sh

# Or manually:
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

## 🎯 Post-Deployment Verification

### Health Checks
```bash
# Check all services
curl -f https://verbfy.com/api/health
curl -f https://api.verbfy.com/api/health

# Check Docker containers
docker ps

# Check logs
docker-compose -f docker-compose.production.yml logs -f
```

### Security Verification
```bash
# Check security headers
curl -I https://verbfy.com

# Verify SSL certificates
sudo certbot certificates

# Check rate limiting
# (Test by making multiple rapid requests)
```

### Performance Verification
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://verbfy.com

# Check database performance
# (Monitor query performance in MongoDB)
```

---

**⚠️ IMPORTANT**: Do NOT deploy until ALL critical issues are resolved. The security vulnerabilities identified are severe and could compromise the entire application if deployed as-is.

**Estimated Time to Fix Critical Issues**: 2-3 days  
**Estimated Time to Fix High Priority Issues**: 1 week  
**Total Pre-Deployment Time**: 1-2 weeks 