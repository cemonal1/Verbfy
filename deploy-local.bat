@echo off
REM Verbfy Local Deployment Script for Windows
REM This script is for testing deployment locally before pushing to server

echo 🚀 Starting Verbfy local deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://docker.com
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running
    echo Please start Docker Desktop
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Create environment files if they don't exist
if not exist "backend\.env.production" (
    echo ℹ️  Creating backend production environment file...
    copy "backend\env.production.example" "backend\.env.production"
)

if not exist "verbfy-app\.env.production" (
    echo ℹ️  Creating frontend production environment file...
    copy "verbfy-app\env.production.example" "verbfy-app\.env.production"
)

REM Create root .env file
echo NODE_ENV=production > .env

echo ✅ Environment files ready

REM Build and start services
echo 🏗️  Building and starting Docker services...
docker-compose -f docker-compose.production.yml down --remove-orphans
docker-compose -f docker-compose.production.yml up -d --build

REM Wait for services to start
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check service status
echo 📊 Checking service status...
docker-compose -f docker-compose.production.yml ps

REM Test backend health
echo 🔍 Testing backend health...
curl -f http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy!
) else (
    echo ⚠️  Backend health check failed, checking logs...
    docker-compose -f docker-compose.production.yml logs verbfy-backend
)

REM Test frontend
echo 🔍 Testing frontend...
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is accessible!
) else (
    echo ⚠️  Frontend check failed, checking logs...
    docker-compose -f docker-compose.production.yml logs verbfy-frontend
)

echo.
echo 🎉 Local deployment completed!
echo.
echo 🌐 Access URLs:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:5000
echo    Health Check: http://localhost:5000/api/health
echo.
echo 📝 Useful Commands:
echo    View logs: docker-compose -f docker-compose.production.yml logs -f
echo    Stop services: docker-compose -f docker-compose.production.yml down
echo    Restart services: docker-compose -f docker-compose.production.yml restart
echo.
pause 