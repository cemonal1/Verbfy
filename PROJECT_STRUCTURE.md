# 📁 Verbfy Project Structure

## Core Directories

```
verbfy/
├── backend/                 # Node.js/Express API server
│   ├── src/                # Source code
│   │   ├── controllers/    # API controllers
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── config/        # Configuration files
│   │   └── utils/         # Utility functions
│   ├── package.json       # Dependencies
│   └── .env.production    # Production environment
│
├── verbfy-app/             # Next.js frontend application
│   ├── pages/             # Next.js pages
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── features/      # Feature modules
│   │   ├── hooks/         # Custom hooks
│   │   ├── context/       # React contexts
│   │   └── lib/           # Utilities and API client
│   ├── public/            # Static assets
│   ├── package.json       # Dependencies
│   └── .env.production    # Production environment
│
├── docker-compose.yml      # Development containers
├── nginx.conf             # Nginx configuration
└── README.md              # Project documentation
```

## Key Features

- **Authentication**: JWT with refresh tokens, OAuth (Google/Microsoft/Apple)
- **Real-time**: Socket.IO for chat and notifications
- **Video Conferencing**: LiveKit integration
- **Payments**: Stripe integration
- **Database**: MongoDB with Mongoose
- **Security**: Helmet, CORS, rate limiting
- **Deployment**: Docker, Nginx, SSL

## Getting Started

1. **Development**: `./start-dev.sh` or `start-dev.bat`
2. **Production**: See `PRODUCTION_DEPLOYMENT_GUIDE.md`
3. **CORS Issues**: Run `./fix-cors-production.sh`

## Environment Files

- `backend/.env.production` - Backend production config
- `verbfy-app/.env.production` - Frontend production config

## Production Server Fix

If you're experiencing CORS issues in production:

1. **Connect to server**: `ssh root@46.62.161.121`
2. **Navigate to project**: `cd /root/Verbfy`
3. **Pull latest changes**: `git pull origin main`
4. **Run fix script**: `./fix-cors-production.sh`
5. **Test**: `./test-cors.sh`

See `PRODUCTION_SERVER_FIX_GUIDE.md` for detailed troubleshooting.

## Current Status

✅ **Frontend**: Next.js application with static export  
✅ **Backend**: Node.js API with MongoDB  
✅ **Security**: CORS, authentication, rate limiting  
🔧 **Production**: CORS configuration updated for www.verbfy.com  
📋 **Documentation**: Cleaned up and simplified  

## Next Steps

1. Apply CORS fixes on production server
2. Test login functionality
3. Monitor application performance
4. Continue feature development