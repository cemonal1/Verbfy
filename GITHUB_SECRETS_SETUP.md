# GitHub Secrets Configuration Guide

This document lists all the secrets that need to be configured in your GitHub repository for the production deployment workflow to work properly.

## How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add the secret name and value

## Required Secrets for Production Deployment

### 🔐 Deployment Infrastructure
| Secret Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `PRODUCTION_HOST` | Production server IP/hostname | ✅ Yes | `46.62.161.121` |
| `PRODUCTION_USER` | SSH username for production server | ✅ Yes | `root` |
| `PRODUCTION_SSH_KEY` | Private SSH key for server access | ✅ Yes | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_PORT` | SSH port (optional, defaults to 22) | ❌ No | `22` |

### 🗄️ Database
| Secret Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `MONGO_URI` | MongoDB connection string | ✅ Yes | `mongodb://username:password@host:port/database` |

### 🔑 Authentication & Security
| Secret Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `JWT_SECRET` | JWT signing secret | ✅ Yes | `your-super-secret-jwt-key-here` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | ✅ Yes | `your-refresh-token-secret-here` |

### 🌐 URLs & Endpoints
| Secret Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `FRONTEND_URL` | Frontend application URL | ✅ Yes | `https://verbfy.com` |
| `BACKEND_URL` | Backend API URL | ✅ Yes | `https://api.verbfy.com` |
| `NEXT_PUBLIC_API_URL` | Public API URL for frontend | ✅ Yes | `https://api.verbfy.com/api` |
| `NEXT_PUBLIC_BACKEND_URL` | Public backend URL for frontend | ✅ Yes | `https://api.verbfy.com` |

### 🎥 LiveKit (Video/Audio)
| Secret Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `LIVEKIT_CLOUD_API_KEY` | LiveKit Cloud API key | ✅ Yes | `your-livekit-api-key` |
| `LIVEKIT_CLOUD_API_SECRET` | LiveKit Cloud API secret | ✅ Yes | `your-livekit-api-secret` |
| `LIVEKIT_CLOUD_URL` | LiveKit Cloud WebSocket URL | ✅ Yes | `wss://your-project.livekit.cloud` |
| `NEXT_PUBLIC_LIVEKIT_URL` | Public LiveKit URL for frontend | ✅ Yes | `wss://your-project.livekit.cloud` |
| `NEXT_PUBLIC_LIVEKIT_CLOUD_URL` | Public LiveKit Cloud URL | ✅ Yes | `wss://your-project.livekit.cloud` |

### 🔐 OAuth Providers
| Secret Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ❌ No | `your-google-client-id.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ❌ No | `your-google-client-secret` |
| `MS_CLIENT_ID` | Microsoft OAuth client ID | ❌ No | `your-microsoft-client-id` |
| `MS_CLIENT_SECRET` | Microsoft OAuth client secret | ❌ No | `your-microsoft-client-secret` |

### 💳 Payment (Stripe)
| Secret Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | ❌ No | `sk_live_...` or `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ❌ No | `pk_live_...` or `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret | ❌ No | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public Stripe key for frontend | ❌ No | `pk_live_...` or `pk_test_...` |

### 📧 Email (SMTP)
| Secret Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `SMTP_HOST` | SMTP server hostname | ❌ No | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | ❌ No | `587` |
| `SMTP_USER` | SMTP username | ❌ No | `your-email@gmail.com` |
| `SMTP_PASS` | SMTP password | ❌ No | `your-app-password` |
| `SMTP_FROM` | From email address | ❌ No | `noreply@verbfy.com` |

### ☁️ AWS (File Storage)
| Secret Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `AWS_REGION` | AWS region | ❌ No | `us-east-1` |
| `S3_BUCKET` | S3 bucket name | ❌ No | `verbfy-uploads` |
| `AWS_ACCESS_KEY_ID` | AWS access key ID | ❌ No | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | ❌ No | `your-secret-key` |

### 📊 Monitoring & Analytics
| Secret Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `SENTRY_DSN` | Sentry error tracking DSN | ❌ No | `https://...@sentry.io/...` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics measurement ID | ❌ No | `G-XXXXXXXXXX` |

### 📢 Notifications
| Secret Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `SLACK_WEBHOOK_URL` | Slack webhook for deployment notifications | ❌ No | `https://hooks.slack.com/services/...` |

## Priority Setup Order

### 1. Essential (Deploy First)
```bash
PRODUCTION_HOST
PRODUCTION_USER  
PRODUCTION_SSH_KEY
MONGO_URI
JWT_SECRET
JWT_REFRESH_SECRET
FRONTEND_URL
BACKEND_URL
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_BACKEND_URL
```

### 2. Core Features
```bash
LIVEKIT_CLOUD_API_KEY
LIVEKIT_CLOUD_API_SECRET
LIVEKIT_CLOUD_URL
NEXT_PUBLIC_LIVEKIT_URL
NEXT_PUBLIC_LIVEKIT_CLOUD_URL
```

### 3. Optional Features
```bash
# OAuth, Stripe, Email, AWS, Monitoring secrets
# Add these as you enable features
```

## Validation

After adding secrets, you can validate the deployment by:

1. Triggering the workflow manually from GitHub Actions
2. Checking the "Validate deployment secrets" step
3. Monitoring the deployment logs for any missing secret errors

## Security Notes

- Never commit secrets to your repository
- Use strong, unique secrets for production
- Rotate secrets regularly
- Use different secrets for staging and production environments
- Consider using GitHub Environments for additional security