# 🎓 Verbfy - Premium English Learning Platform

## Overview

Verbfy is a premium English learning platform that connects students with teachers through real-time video lessons. Built with modern technologies and a focus on user experience, Verbfy provides a robust platform for both one-on-one lessons and group conversations. **Production-ready** with full domain deployment support.

## 🚀 Features

- **Real-time Video Lessons**: High-quality video conferencing using LiveKit
- **Lesson Scheduling**: Flexible booking system for students and teachers
- **Material Sharing**: Real-time document and resource sharing during lessons
- **Group Conversations**: Up to 5-person free conversation rooms
- **Role-Based Access**: Separate interfaces for students, teachers, and admins
- **Responsive Design**: Mobile-first approach for all device sizes
- **Enterprise Security**: HTTPS, CSP, rate limiting, and comprehensive security measures
- **Production Ready**: Full domain deployment support with Docker and Nginx

## 🛠️ Tech Stack

### Frontend
- Next.js (Pages Router)
- TypeScript
- TailwindCSS
- LiveKit Client SDK
- Zustand/Context API for state management

### Backend
- Node.js with Express
- MongoDB with Mongoose
- LiveKit Server
- JWT Authentication
- Socket.IO (being migrated to LiveKit)

## 📋 Prerequisites

- Node.js 18+
- MongoDB
- LiveKit Server (self-hosted or cloud)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/verbfy.git
   cd verbfy
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../verbfy-app
   npm install
   ```

3. **Environment Setup**

   Backend (.env):
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   ```

   Frontend (.env.local):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_LIVEKIT_URL=your_livekit_url
   ```

4. **Start Development Servers**

   Using the provided scripts:
   ```bash
   # Windows
   ./start-dev.bat

   # Linux/Mac
   ./start-dev.sh
   ```

   Or manually:
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd verbfy-app
   npm run dev
   ```

## 🏗️ Project Structure

```
verbfy/
├── backend/                 # Express backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   └── services/      # Business logic
│   └── package.json
│
├── verbfy-app/             # Next.js frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── context/      # React context
│   │   └── lib/          # Utilities
│   ├── pages/            # Next.js pages
│   └── package.json
│
├── start-dev.bat          # Windows startup script
├── start-dev.sh           # Unix startup script
└── README.md
```

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd verbfy-app
npm test
```

## 📦 Deployment

### Quick Deployment
```bash
# Run the automated deployment script
chmod +x deploy-production.sh
./deploy-production.sh
```

### Manual Deployment
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed production deployment instructions.

### Domain Configuration
- **Main Domain**: `verbfy.com`
- **API Subdomain**: `api.verbfy.com`
- **LiveKit Subdomain**: `livekit.verbfy.com`

### Production Features
- ✅ **Docker Containerization** - Complete application containerization
- ✅ **Nginx Reverse Proxy** - SSL termination and load balancing
- ✅ **Automatic SSL** - Let's Encrypt certificate management
- ✅ **Security Headers** - Comprehensive security measures
- ✅ **Rate Limiting** - API protection and abuse prevention
- ✅ **Health Monitoring** - Automated service health checks

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- [Your Name] - Initial work - [GitHub Profile]

## 🙏 Acknowledgments

- LiveKit team for the excellent WebRTC infrastructure
- Next.js team for the amazing framework
- All contributors who have helped shape this project 