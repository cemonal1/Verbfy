#!/bin/bash

# Verbfy Development Environment Starter
# This script starts both backend and frontend servers for development

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Verbfy Development Environment...${NC}"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}❌ npm is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo

# Function to cleanup on exit
cleanup() {
    echo
    echo -e "${YELLOW}🛑 Stopping development servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "verbfy-app/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd verbfy-app && npm install && cd ..
fi

echo -e "${BLUE}🔧 Starting Backend Server...${NC}"
cd backend && npm run dev &
BACKEND_PID=$!

echo -e "${YELLOW}⏳ Waiting 5 seconds for backend to initialize...${NC}"
sleep 5

echo -e "${BLUE}🎨 Starting Frontend Server...${NC}"
cd ../verbfy-app && npm run dev &
FRONTEND_PID=$!

echo
echo -e "${GREEN}✅ Development servers are starting...${NC}"
echo -e "${BLUE}📍 Backend:${NC}  http://localhost:5000"
echo -e "${BLUE}📍 Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}📍 API Docs:${NC} http://localhost:5000/api-docs"
echo
echo -e "${YELLOW}💡 Tip: Open http://localhost:3000 in your browser${NC}"
echo -e "${YELLOW}🛑 Press Ctrl+C to stop both servers${NC}"
echo

# Wait for user to stop
wait