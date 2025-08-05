# 🚀 LiveKit Server Setup for Verbfy

This guide will help you set up LiveKit server for video conferencing in your Verbfy application.

## 📋 Prerequisites

1. **Docker Desktop** - Download and install from [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. **Node.js** - Version 18 or higher
3. **Git** - For cloning the repository

## 🔧 Environment Configuration

### Backend Environment Variables

Add these to your `backend/.env` file:

```env
# LiveKit Configuration
LIVEKIT_CLOUD_API_KEY=uc4eRZW1iYWcX2UXeoQ/v1JJ/ackt/qelbFiatS/WwM=
LIVEKIT_CLOUD_API_SECRET=1M2k3w3MV/PMZIvB2tANCZ0ZXcw93hhkV4N7eyW+QNQ=
LIVEKIT_CLOUD_URL=wss://localhost:7880

# Self-Hosted Configuration (same as cloud for local development)
LIVEKIT_SELF_API_KEY=uc4eRZW1iYWcX2UXeoQ/v1JJ/ackt/qelbFiatS/WwM=
LIVEKIT_SELF_API_SECRET=1M2k3w3MV/PMZIvB2tANCZ0ZXcw93hhkV4N7eyW+QNQ=
LIVEKIT_SELF_URL=wss://localhost:7880
```

### Frontend Environment Variables

Add these to your `verbfy-app/.env.local` file:

```env
NEXT_PUBLIC_LIVEKIT_URL=wss://localhost:7880
NEXT_PUBLIC_LIVEKIT_CLOUD_URL=wss://localhost:7880
```

## 🏠 Local Development Setup

### Option 1: Quick Start (Recommended)

1. **Start LiveKit Server:**
   ```bash
   # Windows
   start-livekit.bat
   
   # Linux/Mac
   chmod +x start-livekit.sh
   ./start-livekit.sh
   ```

2. **Start Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend Server:**
   ```bash
   cd verbfy-app
   npm run dev
   ```

### Option 2: Docker Compose (Full Stack)

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop all services:**
   ```bash
   docker-compose down
   ```

### Option 3: Manual Docker

1. **Start LiveKit server:**
   ```bash
   docker run --rm -p 7880:7880 -p 7881:7881 -p 7882:7882/udp \
     -e LIVEKIT_KEYS=uc4eRZW1iYWcX2UXeoQ/v1JJ/ackt/qelbFiatS/WwM=:1M2k3w3MV/PMZIvB2tANCZ0ZXcw93hhkV4N7eyW+QNQ= \
     livekit/livekit-server --dev --node-ip=0.0.0.0
   ```

## 🌐 Production Setup

### LiveKit Cloud (Recommended for Production)

1. **Create LiveKit Cloud Account:**
   - Go to [https://cloud.livekit.io/](https://cloud.livekit.io/)
   - Sign up for a free account
   - Create a new project

2. **Get API Credentials:**
   - Copy your API key, secret, and URL from the project settings
   - Update your environment variables with the real values

3. **Update Environment Variables:**
   ```env
   LIVEKIT_CLOUD_API_KEY=your_real_api_key
   LIVEKIT_CLOUD_API_SECRET=your_real_api_secret
   LIVEKIT_CLOUD_URL=wss://your-project.livekit.cloud
   ```

### Self-Hosted Production

1. **Deploy LiveKit Server:**
   - Use the provided Docker Compose file
   - Configure proper SSL certificates
   - Set up a domain name

2. **Update Environment Variables:**
   ```env
   LIVEKIT_SELF_API_KEY=your_production_api_key
   LIVEKIT_SELF_API_SECRET=your_production_api_secret
   LIVEKIT_SELF_URL=wss://your-domain.com
   ```

## 🧪 Testing

### Test LiveKit Connection

1. **Start all services**
2. **Open your browser** to `http://localhost:3000`
3. **Register/Login** to your account
4. **Navigate to a lesson room** (e.g., `/talk/[reservationId]`)
5. **Check browser console** for connection logs
6. **Test video/audio** permissions

### Troubleshooting

#### Common Issues:

1. **"Docker not found"**
   - Install Docker Desktop
   - Start Docker Desktop
   - Restart your terminal

2. **"Port already in use"**
   - Stop other services using ports 7880, 7881, 7882
   - Or change ports in the configuration

3. **"WebSocket connection failed"**
   - Check if LiveKit server is running
   - Verify environment variables
   - Check browser console for errors

4. **"Camera/Microphone not working"**
   - Allow browser permissions
   - Check HTTPS requirement (required for media)
   - Test with different browser

#### Debug Commands:

```bash
# Check if LiveKit server is running
curl http://localhost:7881/health

# Check Docker containers
docker ps

# View LiveKit logs
docker logs verbfy-livekit

# Test WebSocket connection
wscat -c ws://localhost:7880
```

## 📚 Additional Resources

- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit Cloud](https://cloud.livekit.io/)
- [LiveKit GitHub](https://github.com/livekit/livekit-server)
- [LiveKit React Components](https://github.com/livekit/components-react)

## ✅ Verification Checklist

- [ ] Docker Desktop installed and running
- [ ] LiveKit server started on port 7880
- [ ] Backend server running on port 5001
- [ ] Frontend server running on port 3000
- [ ] Environment variables configured
- [ ] Can access video lesson room
- [ ] Camera/microphone permissions granted
- [ ] Video/audio working in lesson room

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review browser console for errors
3. Check server logs for backend errors
4. Verify all environment variables are set correctly
5. Ensure all services are running on correct ports 