@echo off
REM Verbfy Local Staging Deployment Script for Windows
REM This script deploys the Verbfy application locally for staging testing

echo 🚀 Starting Verbfy Local Staging Deployment...

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    exit /b 1
)

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    exit /b 1
)

echo [INFO] Prerequisites check completed ✓

REM Setup environment variables for staging
echo [INFO] Setting up staging environment variables...

REM Create staging environment file for backend
(
echo NODE_ENV=staging
echo MONGO_URI=mongodb+srv://Verbfy:VerbfyDataBack@verbfy.kxzpcit.mongodb.net/verbfy_staging?retryWrites=true^&w=majority^&appName=Verbfy
echo PORT=5001
echo JWT_SECRET=staging-jwt-secret-key-for-testing-only
echo JWT_REFRESH_SECRET=staging-jwt-refresh-secret-key-for-testing-only
echo FRONTEND_URL=http://localhost:3001
echo CORS_ORIGIN=http://localhost:3001
echo LIVEKIT_SELF_URL=wss://localhost:7883
echo LIVEKIT_SELF_API_KEY=test-key
echo LIVEKIT_SELF_API_SECRET=test-secret
) > backend\.env.staging

REM Create staging environment file for frontend
(
echo NODE_ENV=staging
echo NEXT_PUBLIC_API_URL=http://localhost:5001
echo NEXT_PUBLIC_LIVEKIT_URL=wss://localhost:7883
echo NEXT_PUBLIC_LIVEKIT_CLOUD_URL=wss://localhost:7883
) > verbfy-app\.env.staging

echo [INFO] Staging environment variables configured ✓

REM Build frontend for staging
echo [INFO] Building frontend for staging...
cd verbfy-app
call npm ci
if %errorlevel% neq 0 (
    echo [ERROR] Frontend dependencies installation failed!
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    exit /b 1
)
cd ..
echo [INFO] Frontend staging build completed ✓

REM Build backend for staging
echo [INFO] Building backend for staging...
cd backend
call npm ci
if %errorlevel% neq 0 (
    echo [ERROR] Backend dependencies installation failed!
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed!
    exit /b 1
)
cd ..
echo [INFO] Backend staging build completed ✓

REM Start backend in staging mode
echo [INFO] Starting backend in staging mode...
cd backend
start "Verbfy Backend Staging" cmd /k "set NODE_ENV=staging && npm run dev"
cd ..
echo [INFO] Backend started in new window ✓

REM Start frontend in staging mode
echo [INFO] Starting frontend in staging mode...
cd verbfy-app
start "Verbfy Frontend Staging" cmd /k "set NODE_ENV=staging && npm run dev"
cd ..
echo [INFO] Frontend started in new window ✓

REM Wait for services to start
echo [INFO] Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Display staging information
echo.
echo 🎉 Verbfy local staging deployment completed successfully!
echo.
echo 📊 Staging Environment URLs:
echo    Frontend: http://localhost:3001
echo    Backend API: http://localhost:5001
echo    LiveKit: ws://localhost:7883 ^(if running^)
echo.
echo 🔧 Useful Commands:
echo    View backend logs: Check the backend window
echo    View frontend logs: Check the frontend window
echo    Stop staging: Close the opened windows
echo    Restart staging: Run this script again
echo.
echo ⚠️  This is a local staging environment for testing purposes only!
echo.
pause 