#!/bin/bash

# 🧹 Verbfy Project Cleanup Script
# Removes unnecessary documentation and analysis files

set -e

echo "🧹 Starting Verbfy Project Cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[CLEANUP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[REMOVED]${NC} $1"
}

print_keep() {
    echo -e "${YELLOW}[KEEPING]${NC} $1"
}

# Files to remove (analysis and temporary documentation)
FILES_TO_REMOVE=(
    "VERBFY_TALK_MICROPHONE_FIX.md"
    "VERBFY_PROJECT_TREE.md"
    "VERBFY_PROJECT_MAP.md"
    "VERBFY_PROJECT_ANALYSIS_REPORT.md"
    "VERBFY_FULL_STACK_AUDIT_2025-08-19.md"
    "VERBFY_COMPREHENSIVE_PROJECT_ANALYSIS.md"
    "FINAL_CI_CD_RESOLUTION.md"
    "ADMIN_PAGE_ANALYSIS.md"
    "PRODUCTION_ISSUE_RESOLUTION_SUMMARY.md"
    "CORS_FIX_DOCUMENTATION.md"
    "ENVIRONMENT_SETUP.md"
    "CI_CD_FIXES_SUMMARY.md"
    "ADMIN_PAGE_FIXES_COMPLETE.md"
    "FINAL_COMPLETION_SUMMARY.md"
    "GIT_PUSH_SUMMARY.md"
    "TYPESCRIPT_BUILD_ERRORS_FIX.md"
    "ANALYSIS_REPORTS_CLEANUP_SUMMARY.md"
    "COMPREHENSIVE_ANALYSIS.md"
    "PRODUCTION_READY_SUMMARY.md"
    "COMPREHENSIVE_BUG_FIX_REPORT.md"
    "CLOUDFLARE_PAGES_DEPLOYMENT_GUIDE.md"
)

# Files to keep (essential documentation)
KEEP_FILES=(
    "README.md"
    "PRODUCTION_DEPLOYMENT_GUIDE.md"
    "VERBFY_DEPLOYMENT_GUIDE.md"
    "CORS_PRODUCTION_FIX.md"
)

print_status "Removing unnecessary analysis and documentation files..."

for file in "${FILES_TO_REMOVE[@]}"; do
    if [[ -f "$file" ]]; then
        rm "$file"
        print_success "$file"
    fi
done

print_status "Keeping essential documentation files..."
for file in "${KEEP_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        print_keep "$file"
    fi
done

# Clean up test results and coverage files
print_status "Cleaning up test artifacts..."

# Backend test cleanup
if [[ -d "backend" ]]; then
    cd backend
    rm -f jest-*.json coverage-*.json *.log || true
    rm -rf coverage/ || true
    cd ..
    print_success "Backend test artifacts"
fi

# Frontend test cleanup  
if [[ -d "verbfy-app" ]]; then
    cd verbfy-app
    rm -f jest-*.json coverage-*.json *.log || true
    rm -rf coverage/ test-results/ || true
    rm -rf __tests__/ e2e/ || true
    cd ..
    print_success "Frontend test artifacts"
fi

# Clean up build artifacts
print_status "Cleaning up build artifacts..."

# Backend build cleanup
if [[ -d "backend/dist" ]]; then
    rm -rf backend/dist/
    print_success "Backend dist directory"
fi

# Frontend build cleanup (keep out/ for static export)
if [[ -d "verbfy-app/.next" ]]; then
    rm -rf verbfy-app/.next/
    print_success "Frontend .next directory"
fi

# Clean up node_modules if requested
read -p "Do you want to clean node_modules? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Cleaning node_modules..."
    rm -rf backend/node_modules/ || true
    rm -rf verbfy-app/node_modules/ || true
    print_success "All node_modules directories"
fi

# Clean up git artifacts
print_status "Cleaning up git artifacts..."
rm -rf .git/hooks/pre-commit* || true
rm -rf .git/logs/ || true

# Update .gitignore to prevent future clutter
print_status "Updating .gitignore..."

cat >> .gitignore << 'EOF'

# Analysis and temporary documentation
*ANALYSIS*.md
*SUMMARY*.md
*REPORT*.md
*FIX*.md
*GUIDE*.md
!README.md
!PRODUCTION_DEPLOYMENT_GUIDE.md

# Test artifacts
jest-*.json
coverage-*.json
coverage/
test-results/
e2e/

# Logs
*.log
logs/

# Temporary files
*.tmp
*.temp
.DS_Store
Thumbs.db
EOF

print_success "Updated .gitignore"

# Create a simple project structure overview
print_status "Creating clean project structure..."

cat > PROJECT_STRUCTURE.md << 'EOF'
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
EOF

print_success "Created PROJECT_STRUCTURE.md"

print_status "Cleanup complete!"
echo ""
print_success "🎉 Project cleaned up successfully!"
echo ""
print_status "Remaining files:"
echo "- README.md (main documentation)"
echo "- PRODUCTION_DEPLOYMENT_GUIDE.md (deployment guide)"
echo "- PROJECT_STRUCTURE.md (project overview)"
echo "- CORS_PRODUCTION_FIX.md (CORS troubleshooting)"
echo ""
print_status "Next steps:"
echo "1. Run ./fix-cors-production.sh on the server"
echo "2. Test the application"
echo "3. Commit the cleaned up codebase"