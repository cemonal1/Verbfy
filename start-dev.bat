@echo off
REM Verbfy Development Environment Starter for Windows
REM This script starts both backend and frontend servers for development

title Verbfy Development Environment

echo 🚀 Starting Verbfy Development Environment...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed!
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Check if backend dependencies are installed
if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    npm install
    cd ..
)

REM Check if frontend dependencies are installed
if not exist "verbfy-app\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd verbfy-app
    npm install
    cd ..
)

echo 🔧 Starting Backend Server...
start "Verbfy Backend" cmd /k "cd backend && echo Backend Server Starting... && npm run dev"

echo ⏳ Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak > nul

echo 🎨 Starting Frontend Server...
start "Verbfy Frontend" cmd /k "cd verbfy-app && echo Frontend Server Starting... && npm run dev"

echo.
echo ✅ Development servers are starting...
echo 📍 Backend:  http://localhost:5000
echo 📍 Frontend: http://localhost:3000
echo 📍 API Docs: http://localhost:5000/api-docs
echo.
echo 💡 Tip: Open http://localhost:3000 in your browser
echo 🛑 Close the terminal windows to stop the servers
echo.
echo Press any key to close this launcher...
pause > nul