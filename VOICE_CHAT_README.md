# 🎤 P2P Voice Chat System

A production-ready, scalable, and secure microphone-only P2P voice chat system built with Node.js, Express, TypeScript, React, and WebRTC.

## 🚀 Features

- **Microphone-only P2P voice chat** (no camera support)
- **JWT authentication** for secure connections
- **Multiple rooms** with maximum 5 users per room
- **WebSocket with polling fallback** for reliable connections
- **Cross-platform compatibility** (iOS Safari, Android Chrome, Desktop)
- **Production-ready** with proper error handling and logging
- **Auto-cleanup** of empty rooms
- **Real-time signaling** for WebRTC peer connections

## 📁 Project Structure

```
backend/
├── src/
│   ├── voiceChatServer.ts     # Main Socket.IO server for voice chat
│   ├── verbfyTalkServer.ts    # Legacy VerbfyTalk server
│   └── index.ts               # Main server entry point

frontend/
├── src/
│   ├── hooks/
│   │   └── useVoiceChat.ts    # React hook for voice chat functionality
│   └── components/
│       └── voiceChat/
│           └── VoiceChatRoom.tsx  # Voice chat room component
└── pages/
    └── verbfy-talk/
        └── [roomId].tsx       # Room page
```

## 🔧 Environment Setup

### Backend Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/verbfy

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://www.verbfy.com

# SSL (for production)
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

### Frontend Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_BACKEND_URL=https://api.verbfy.com
```

## 🚀 Running the Application

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Production Deployment

### 1. Nginx Configuration

Create `/etc/nginx/sites-available/voice-chat`:

```nginx
server {
    listen 443 ssl http2;
    server_name api.verbfy.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.verbfy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.verbfy.com/privkey.pem;
    
    # WebSocket upgrade for Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeout settings
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60;
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'verbfy-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 3. Deploy with PM2

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🔐 Security Features

- **JWT Authentication**: Secure user authentication
- **CORS Configuration**: Proper cross-origin resource sharing
- **Rate Limiting**: Prevent abuse and DDoS attacks
- **Input Validation**: Sanitize all user inputs
- **HTTPS/WSS**: Secure connections in production
- **Permissions Policy**: Control microphone access

## 🎯 API Endpoints

### Socket.IO Events

#### Client → Server

- `authenticate` - Authenticate user with JWT token
- `joinRoom` - Join a voice chat room
- `leaveRoom` - Leave current room
- `signal` - Send WebRTC signaling data

#### Server → Client

- `authenticated` - Authentication successful
- `authentication_error` - Authentication failed
- `roomJoined` - Successfully joined room
- `userJoined` - Another user joined the room
- `userLeft` - A user left the room
- `roomFull` - Room is at capacity
- `signal` - WebRTC signaling data from another peer
- `error` - General error message

## 🎤 WebRTC Configuration

The system uses Google's STUN servers for NAT traversal:

```typescript
const webrtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
  ]
};
```

## 🐛 Troubleshooting

### WebSocket Connection Issues

1. **Check Nginx configuration** for proper WebSocket upgrade headers
2. **Verify SSL certificates** are valid and not expired
3. **Check firewall settings** allow WebSocket connections
4. **Monitor server logs** for connection errors

### Microphone Permission Issues

1. **Ensure HTTPS** - Microphone access requires secure context
2. **Check browser permissions** - User must allow microphone access
3. **Verify Permissions-Policy** headers are correctly set
4. **Test in incognito mode** to avoid cached permission issues

### Audio Quality Issues

1. **Check network connectivity** - Poor connection affects audio quality
2. **Verify STUN servers** are accessible
3. **Monitor peer connection states** in browser dev tools
4. **Test with different browsers** to isolate issues

## 📊 Monitoring and Logging

### Server Logs

The server logs important events:

- User connections and disconnections
- Room join/leave events
- WebRTC signaling messages
- Authentication attempts
- Error conditions

### Client Logs

The client logs:

- Socket connection status
- Microphone permission requests
- WebRTC peer connection states
- Audio stream status
- Error conditions

## 🔄 Development Workflow

1. **Make changes** to TypeScript files
2. **Run type checking** with `npm run type-check`
3. **Test locally** with `npm run dev`
4. **Build for production** with `npm run build`
5. **Deploy** using PM2 and Nginx

## 📝 License

This project is part of the Verbfy platform and is proprietary software.

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Include comprehensive logging
4. Test on multiple browsers and devices
5. Update documentation for any API changes

## 📞 Support

For technical support or questions about the voice chat system, please contact the development team.
