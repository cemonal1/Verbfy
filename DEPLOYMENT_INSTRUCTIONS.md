# 🚀 Verbfy Deployment Instructions

## 📋 Overview

This guide will help you deploy your Verbfy project to your Ubuntu server (46.62.161.121).

## 🎯 **Quick Deployment (Recommended)**

### **Step 1: Connect to Your Server**

```bash
# Connect via SSH to your server
ssh root@46.62.161.121
```

### **Step 2: Run the Deployment Script**

```bash
# Navigate to the project directory (if it exists)
cd /opt/verbfy

# If the directory doesn't exist, clone the repository
if [ ! -d "/opt/verbfy" ]; then
    mkdir -p /opt/verbfy
    cd /opt/verbfy
    git clone https://github.com/cemon/Verbfy.git .
fi

# Make the deployment script executable
chmod +x deploy-server.sh

# Run the deployment script
./deploy-server.sh
```

## 🔧 **Manual Deployment Steps**

If you prefer to deploy manually, follow these steps:

### **Step 1: Server Preparation**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y
```

### **Step 2: Clone Repository**

```bash
# Create project directory
sudo mkdir -p /opt/verbfy
cd /opt/verbfy

# Clone repository
git clone https://github.com/cemon/Verbfy.git .
```

### **Step 3: Configure Environment**

```bash
# Create backend production environment
cat > backend/.env.production << EOF
# Production Environment Variables for Verbfy Backend
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://Verbfy:VerbfyDataBack@verbfy.kxzpcit.mongodb.net/verbfy?retryWrites=true&w=majority&appName=Verbfy
JWT_SECRET=ddb2070e412a4e227a233c3ed275d1cc6603ce9f9a0bfda81ecbbbbab81fd491
JWT_REFRESH_SECRET=ddb2070e412a4e227a233c3ed275d1cc6603ce9f9a0bfda81ecbbbbab81fd491_refresh
FRONTEND_URL=http://46.62.161.121:3000
CORS_ORIGIN=http://46.62.161.121:3000

# LiveKit Configuration
LIVEKIT_CLOUD_API_KEY=uc4eRZW1iYWcX2UXeoQ/v1JJ/ackt/qelbFiatS/WwM=
LIVEKIT_CLOUD_API_SECRET=1M2k3w3MV/PMZIvB2tANCZ0ZXcw93hhkV4N7eyW+QNQ=
LIVEKIT_CLOUD_URL=ws://46.62.161.121:7880

# Self-Hosted LiveKit Configuration
LIVEKIT_SELF_API_KEY=dev-api-key
LIVEKIT_SELF_API_SECRET=dev-api-secret
LIVEKIT_SELF_URL=ws://46.62.161.121:7880

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security Configuration
SESSION_SECRET=verbfy-session-secret-2024

# Logging Configuration
LOG_LEVEL=info
EOF

# Create frontend production environment
cat > verbfy-app/.env.production << EOF
# Production Environment Variables for Verbfy Frontend
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://46.62.161.121:5000
NEXT_PUBLIC_LIVEKIT_URL=ws://46.62.161.121:7880
NEXT_PUBLIC_LIVEKIT_CLOUD_URL=ws://46.62.161.121:7880
NEXT_PUBLIC_APP_URL=http://46.62.161.121:3000
EOF

# Create root .env file
echo "NODE_ENV=production" > .env
```

### **Step 4: Deploy with Docker**

```bash
# Build and start services
docker-compose -f docker-compose.production.yml down --remove-orphans
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to start
sleep 30

# Check service status
docker-compose -f docker-compose.production.yml ps
```

### **Step 5: Verify Deployment**

```bash
# Test backend health
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost:3000

# Check logs if needed
docker-compose -f docker-compose.production.yml logs -f
```

## 🌐 **Access Your Application**

Once deployed, you can access your application at:

- **Frontend**: http://46.62.161.121:3000
- **Backend API**: http://46.62.161.121:5000
- **Health Check**: http://46.62.161.121:5000/api/health

## 📊 **Monitoring and Management**

### **View Service Status**
```bash
docker-compose -f docker-compose.production.yml ps
```

### **View Logs**
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f verbfy-backend
docker-compose -f docker-compose.production.yml logs -f verbfy-frontend
```

### **Restart Services**
```bash
# Restart all services
docker-compose -f docker-compose.production.yml restart

# Restart specific service
docker-compose -f docker-compose.production.yml restart verbfy-backend
```

### **Update Application**
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   sudo netstat -tulpn | grep :5000
   
   # Kill the process
   sudo kill -9 <PID>
   ```

2. **Docker Permission Issues**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   
   # Log out and back in, or run:
   newgrp docker
   ```

3. **Environment File Issues**
   ```bash
   # Check file encoding
   file backend/.env.production
   
   # Recreate with proper encoding
   cat > backend/.env.production << 'EOF'
   NODE_ENV=production
   # ... other variables
   EOF
   ```

4. **Service Won't Start**
   ```bash
   # Check logs
   docker-compose -f docker-compose.production.yml logs verbfy-backend
   
   # Check if ports are available
   sudo netstat -tulpn | grep -E ':(3000|5000|7880)'
   ```

### **Reset Everything**
```bash
# Stop all services
docker-compose -f docker-compose.production.yml down

# Remove all containers and volumes
docker-compose -f docker-compose.production.yml down -v

# Remove all images
docker system prune -a

# Start fresh
./deploy-server.sh
```

## 🔒 **Security Considerations**

1. **Firewall Configuration**
   ```bash
   # Allow necessary ports
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw allow 3000/tcp  # Frontend
   sudo ufw allow 5000/tcp  # Backend
   sudo ufw allow 7880/tcp  # LiveKit
   ```

2. **SSL Certificate (Optional)**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx -y
   
   # Get SSL certificate (if you have a domain)
   sudo certbot --nginx -d your-domain.com
   ```

## 📝 **Post-Deployment Checklist**

- [ ] ✅ All services are running
- [ ] ✅ Frontend is accessible at http://46.62.161.121:3000
- [ ] ✅ Backend API is accessible at http://46.62.161.121:5000
- [ ] ✅ Health check passes at http://46.62.161.121:5000/api/health
- [ ] ✅ No errors in logs
- [ ] ✅ Database connection is working
- [ ] ✅ LiveKit server is running
- [ ] ✅ All environment variables are set correctly

## 🎯 **Next Steps**

1. **Set up a domain** (optional but recommended)
2. **Configure SSL certificates**
3. **Set up monitoring and alerts**
4. **Configure automated backups**
5. **Set up CI/CD pipeline**

## 📞 **Support**

If you encounter any issues during deployment:

1. Check the logs: `docker-compose -f docker-compose.production.yml logs -f`
2. Verify environment variables are set correctly
3. Ensure all required ports are open
4. Check if Docker and Docker Compose are installed properly

---

**Happy Deploying! 🚀** 