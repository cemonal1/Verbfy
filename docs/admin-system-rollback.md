# Admin Notification System - Rollback Guide

## Overview

This document provides comprehensive instructions for rolling back the Verbfy Admin Notification System in case of deployment issues, critical bugs, or system failures. The rollback procedures are designed to minimize downtime and ensure system stability.

## Table of Contents

1. [Rollback Strategy](#rollback-strategy)
2. [Pre-Rollback Assessment](#pre-rollback-assessment)
3. [Emergency Rollback Procedures](#emergency-rollback-procedures)
4. [Planned Rollback Procedures](#planned-rollback-procedures)
5. [Database Rollback](#database-rollback)
6. [Frontend Rollback](#frontend-rollback)
7. [Backend Rollback](#backend-rollback)
8. [Socket.IO Rollback](#socketio-rollback)
9. [Configuration Rollback](#configuration-rollback)
10. [Verification and Testing](#verification-and-testing)
11. [Post-Rollback Actions](#post-rollback-actions)
12. [Troubleshooting](#troubleshooting)

## Rollback Strategy

### Rollback Types

1. **Emergency Rollback**: Immediate rollback due to critical system failure
2. **Planned Rollback**: Scheduled rollback due to identified issues
3. **Partial Rollback**: Rolling back specific components while maintaining others
4. **Complete Rollback**: Full system rollback to previous stable state

### Rollback Triggers

- Critical security vulnerabilities
- System performance degradation > 50%
- Database corruption or data loss
- Socket.IO connection failures affecting > 80% of users
- Admin authentication system failures
- Memory leaks or resource exhaustion

## Pre-Rollback Assessment

### 1. Issue Identification

Before initiating a rollback, assess the following:

```bash
# Check system health
curl -f http://localhost:5000/api/health

# Check application logs
pm2 logs verbfy-backend --lines 100 | grep -i error

# Check system resources
top -p $(pgrep -f "verbfy-backend")
free -h
df -h

# Check database connectivity
mongosh --eval "db.adminCommand('ping')"

# Check Socket.IO status
netstat -tulpn | grep :5000
```

### 2. Impact Assessment

Document the following before rollback:

- **Affected Users**: Number of users experiencing issues
- **System Components**: Which components are failing
- **Data Integrity**: Whether data corruption has occurred
- **Timeline**: When the issue started
- **Severity**: Critical, High, Medium, or Low

### 3. Rollback Decision Matrix

| Issue Severity | User Impact | Data Risk | Action |
|---------------|-------------|-----------|---------|
| Critical | >80% | High | Emergency Rollback |
| High | 50-80% | Medium | Planned Rollback |
| Medium | 20-50% | Low | Investigate First |
| Low | <20% | None | Monitor |

## Emergency Rollback Procedures

### 1. Immediate Actions (< 5 minutes)

```bash
#!/bin/bash
# emergency-rollback.sh

echo "=== EMERGENCY ROLLBACK INITIATED ==="
echo "Timestamp: $(date)"

# Stop current services
echo "Stopping current services..."
pm2 stop verbfy-backend
pm2 stop verbfy-frontend

# Switch to previous version
echo "Switching to previous version..."
cd /opt/verbfy/releases
PREVIOUS_RELEASE=$(ls -t | sed -n '2p')
echo "Rolling back to: $PREVIOUS_RELEASE"

# Update symlinks
rm -f /opt/verbfy/current
ln -sf /opt/verbfy/releases/$PREVIOUS_RELEASE /opt/verbfy/current

# Restore previous configuration
cp /opt/verbfy/config/backup/.env.backup /opt/verbfy/current/backend/.env
cp /opt/verbfy/config/backup/.env.local.backup /opt/verbfy/current/frontend/.env.local

# Start services with previous version
cd /opt/verbfy/current/backend
pm2 start ecosystem.config.js --env production

cd /opt/verbfy/current/frontend
pm2 start ecosystem.frontend.config.js --env production

echo "=== EMERGENCY ROLLBACK COMPLETED ==="
echo "Verifying services..."
sleep 10
pm2 status
curl -f http://localhost:5000/api/health
```

### 2. Database Emergency Rollback

```bash
#!/bin/bash
# emergency-db-rollback.sh

echo "=== DATABASE EMERGENCY ROLLBACK ==="

# Stop application to prevent writes
pm2 stop verbfy-backend

# Restore from latest backup
BACKUP_DATE=$(date -d "yesterday" +%Y%m%d)
BACKUP_PATH="/backups/mongodb/$BACKUP_DATE"

if [ -d "$BACKUP_PATH" ]; then
    echo "Restoring database from $BACKUP_PATH"
    mongorestore --drop --uri="mongodb://localhost:27017/verbfy" $BACKUP_PATH/verbfy
    echo "Database restored successfully"
else
    echo "ERROR: Backup not found for $BACKUP_DATE"
    exit 1
fi

# Restart application
pm2 start verbfy-backend
```

## Planned Rollback Procedures

### 1. Pre-Rollback Checklist

- [ ] Notify stakeholders about planned rollback
- [ ] Create current system backup
- [ ] Identify rollback target version
- [ ] Prepare rollback scripts
- [ ] Schedule maintenance window
- [ ] Prepare communication plan

### 2. Planned Rollback Script

```bash
#!/bin/bash
# planned-rollback.sh

set -e

ROLLBACK_VERSION=$1
MAINTENANCE_MODE=true

if [ -z "$ROLLBACK_VERSION" ]; then
    echo "Usage: $0 <rollback_version>"
    exit 1
fi

echo "=== PLANNED ROLLBACK TO VERSION $ROLLBACK_VERSION ==="

# Enable maintenance mode
if [ "$MAINTENANCE_MODE" = true ]; then
    echo "Enabling maintenance mode..."
    cp /opt/verbfy/maintenance.html /var/www/html/index.html
    nginx -s reload
fi

# Create backup of current state
echo "Creating backup of current state..."
BACKUP_DIR="/backups/rollback-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup database
mongodump --uri="mongodb://localhost:27017/verbfy" --out=$BACKUP_DIR/database

# Backup application
cp -r /opt/verbfy/current $BACKUP_DIR/application

# Stop services gracefully
echo "Stopping services..."
pm2 stop verbfy-backend --wait-ready
pm2 stop verbfy-frontend --wait-ready

# Rollback application
echo "Rolling back to version $ROLLBACK_VERSION..."
rm -f /opt/verbfy/current
ln -sf /opt/verbfy/releases/$ROLLBACK_VERSION /opt/verbfy/current

# Restore configuration
echo "Restoring configuration..."
cp /opt/verbfy/config/versions/$ROLLBACK_VERSION/.env /opt/verbfy/current/backend/
cp /opt/verbfy/config/versions/$ROLLBACK_VERSION/.env.local /opt/verbfy/current/frontend/

# Database migration rollback (if needed)
echo "Checking database migrations..."
cd /opt/verbfy/current/backend
npm run migrate:rollback

# Start services
echo "Starting services..."
pm2 start ecosystem.config.js --env production
pm2 start ecosystem.frontend.config.js --env production

# Wait for services to be ready
sleep 30

# Verify rollback
echo "Verifying rollback..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "Backend health check: PASSED"
else
    echo "Backend health check: FAILED"
    exit 1
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "Frontend health check: PASSED"
else
    echo "Frontend health check: FAILED"
    exit 1
fi

# Disable maintenance mode
if [ "$MAINTENANCE_MODE" = true ]; then
    echo "Disabling maintenance mode..."
    rm -f /var/www/html/index.html
    nginx -s reload
fi

echo "=== ROLLBACK COMPLETED SUCCESSFULLY ==="
```

## Database Rollback

### 1. Schema Rollback

```javascript
// migrations/rollback-admin-notifications.js
const mongoose = require('mongoose');

async function rollbackAdminNotifications() {
  try {
    const db = mongoose.connection.db;
    
    // Remove admin notification collections
    await db.collection('adminnotifications').drop().catch(() => {});
    await db.collection('systemhealth').drop().catch(() => {});
    await db.collection('securityalerts').drop().catch(() => {});
    
    // Remove admin notification fields from users
    await db.collection('users').updateMany(
      {},
      { 
        $unset: { 
          adminNotificationSettings: "",
          lastAdminLogin: "",
          adminSessionCount: ""
        }
      }
    );
    
    // Remove admin notification indexes
    await db.collection('users').dropIndex('role_1_lastAdminLogin_-1').catch(() => {});
    
    console.log('Admin notification schema rollback completed');
  } catch (error) {
    console.error('Schema rollback failed:', error);
    throw error;
  }
}

module.exports = rollbackAdminNotifications;
```

### 2. Data Rollback

```bash
#!/bin/bash
# rollback-admin-data.sh

echo "Rolling back admin notification data..."

# Remove admin notification data
mongosh verbfy --eval "
  db.adminnotifications.drop();
  db.systemhealth.drop();
  db.securityalerts.drop();
  
  db.users.updateMany(
    { role: 'admin' },
    { 
      \$unset: { 
        adminNotificationSettings: '',
        lastAdminLogin: '',
        adminSessionCount: ''
      }
    }
  );
  
  print('Admin data rollback completed');
"
```

### 3. Backup Restoration

```bash
#!/bin/bash
# restore-database-backup.sh

BACKUP_DATE=$1

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <backup_date> (format: YYYYMMDD)"
    exit 1
fi

BACKUP_PATH="/backups/mongodb/$BACKUP_DATE"

if [ ! -d "$BACKUP_PATH" ]; then
    echo "Backup not found: $BACKUP_PATH"
    exit 1
fi

echo "Restoring database from $BACKUP_DATE..."

# Stop application
pm2 stop verbfy-backend

# Restore database
mongorestore --drop --uri="mongodb://localhost:27017/verbfy" $BACKUP_PATH/verbfy

# Restart application
pm2 start verbfy-backend

echo "Database restoration completed"
```

## Frontend Rollback

### 1. Static Files Rollback

```bash
#!/bin/bash
# rollback-frontend.sh

ROLLBACK_VERSION=$1

if [ -z "$ROLLBACK_VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

echo "Rolling back frontend to version $ROLLBACK_VERSION..."

# Backup current version
cp -r /var/www/verbfy /var/www/verbfy-backup-$(date +%Y%m%d-%H%M%S)

# Restore previous version
rm -rf /var/www/verbfy/*
cp -r /opt/verbfy/frontend-releases/$ROLLBACK_VERSION/* /var/www/verbfy/

# Update configuration
cp /opt/verbfy/config/versions/$ROLLBACK_VERSION/.env.local /var/www/verbfy/

# Clear CDN cache (if using)
if [ ! -z "$CDN_PURGE_URL" ]; then
    curl -X POST "$CDN_PURGE_URL" -H "Authorization: Bearer $CDN_TOKEN"
fi

# Reload nginx
nginx -s reload

echo "Frontend rollback completed"
```

### 2. Next.js Application Rollback

```bash
#!/bin/bash
# rollback-nextjs.sh

ROLLBACK_VERSION=$1

echo "Rolling back Next.js application..."

# Stop current application
pm2 stop verbfy-frontend

# Switch to previous version
cd /opt/verbfy/frontend-releases
rm -f /opt/verbfy/frontend-current
ln -sf /opt/verbfy/frontend-releases/$ROLLBACK_VERSION /opt/verbfy/frontend-current

# Restore environment configuration
cp /opt/verbfy/config/versions/$ROLLBACK_VERSION/.env.local /opt/verbfy/frontend-current/

# Start application
cd /opt/verbfy/frontend-current
pm2 start ecosystem.frontend.config.js --env production

echo "Next.js rollback completed"
```

## Backend Rollback

### 1. Node.js Application Rollback

```bash
#!/bin/bash
# rollback-backend.sh

ROLLBACK_VERSION=$1

echo "Rolling back backend to version $ROLLBACK_VERSION..."

# Stop current application
pm2 stop verbfy-backend

# Switch to previous version
cd /opt/verbfy/backend-releases
rm -f /opt/verbfy/backend-current
ln -sf /opt/verbfy/backend-releases/$ROLLBACK_VERSION /opt/verbfy/backend-current

# Restore environment configuration
cp /opt/verbfy/config/versions/$ROLLBACK_VERSION/.env /opt/verbfy/backend-current/

# Install dependencies (if needed)
cd /opt/verbfy/backend-current
npm ci --production

# Run database migrations rollback
npm run migrate:rollback

# Start application
pm2 start ecosystem.config.js --env production

echo "Backend rollback completed"
```

### 2. API Rollback

```bash
#!/bin/bash
# rollback-api.sh

echo "Rolling back API endpoints..."

# Restore previous API routes
cp /opt/verbfy/config/backup/routes-backup.js /opt/verbfy/current/backend/routes/

# Restore previous middleware
cp /opt/verbfy/config/backup/middleware-backup.js /opt/verbfy/current/backend/middleware/

# Restart application
pm2 restart verbfy-backend

echo "API rollback completed"
```

## Socket.IO Rollback

### 1. Socket.IO Configuration Rollback

```bash
#!/bin/bash
# rollback-socketio.sh

echo "Rolling back Socket.IO configuration..."

# Stop application
pm2 stop verbfy-backend

# Restore previous Socket.IO configuration
cp /opt/verbfy/config/backup/socket-config-backup.js /opt/verbfy/current/backend/config/socket.js

# Restore previous namespace handlers
cp -r /opt/verbfy/config/backup/socket-handlers-backup/* /opt/verbfy/current/backend/socket/

# Remove admin namespace (if rolling back completely)
rm -f /opt/verbfy/current/backend/socket/adminNamespace.js

# Restart application
pm2 start verbfy-backend

echo "Socket.IO rollback completed"
```

### 2. Redis Configuration Rollback

```bash
#!/bin/bash
# rollback-redis.sh

echo "Rolling back Redis configuration..."

# Flush admin-related Redis data
redis-cli FLUSHDB

# Restore previous Redis configuration
cp /opt/verbfy/config/backup/redis-config-backup.conf /etc/redis/redis.conf

# Restart Redis
systemctl restart redis

echo "Redis rollback completed"
```

## Configuration Rollback

### 1. Environment Variables Rollback

```bash
#!/bin/bash
# rollback-environment.sh

ROLLBACK_VERSION=$1

echo "Rolling back environment configuration..."

# Backup current configuration
cp /opt/verbfy/current/backend/.env /opt/verbfy/config/backup/.env.current
cp /opt/verbfy/current/frontend/.env.local /opt/verbfy/config/backup/.env.local.current

# Restore previous configuration
cp /opt/verbfy/config/versions/$ROLLBACK_VERSION/.env /opt/verbfy/current/backend/
cp /opt/verbfy/config/versions/$ROLLBACK_VERSION/.env.local /opt/verbfy/current/frontend/

# Restart applications
pm2 restart verbfy-backend
pm2 restart verbfy-frontend

echo "Environment rollback completed"
```

### 2. Nginx Configuration Rollback

```bash
#!/bin/bash
# rollback-nginx.sh

echo "Rolling back Nginx configuration..."

# Backup current configuration
cp /etc/nginx/sites-available/verbfy /etc/nginx/sites-available/verbfy.backup

# Restore previous configuration
cp /opt/verbfy/config/backup/nginx-verbfy.backup /etc/nginx/sites-available/verbfy

# Test configuration
nginx -t

if [ $? -eq 0 ]; then
    nginx -s reload
    echo "Nginx configuration rollback completed"
else
    echo "Nginx configuration test failed, restoring current configuration"
    cp /etc/nginx/sites-available/verbfy.backup /etc/nginx/sites-available/verbfy
    exit 1
fi
```

## Verification and Testing

### 1. Automated Verification Script

```bash
#!/bin/bash
# verify-rollback.sh

echo "=== ROLLBACK VERIFICATION ==="

# Test backend health
echo "Testing backend health..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✓ Backend health check passed"
else
    echo "✗ Backend health check failed"
    exit 1
fi

# Test frontend
echo "Testing frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Frontend check passed"
else
    echo "✗ Frontend check failed"
    exit 1
fi

# Test database connectivity
echo "Testing database..."
if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✓ Database connectivity passed"
else
    echo "✗ Database connectivity failed"
    exit 1
fi

# Test authentication
echo "Testing authentication..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}')

if echo $AUTH_RESPONSE | grep -q "token"; then
    echo "✓ Authentication test passed"
else
    echo "✗ Authentication test failed"
fi

# Test admin endpoints (if admin system is supposed to be available)
echo "Testing admin endpoints..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@verbfy.com","password":"adminpassword"}')

if echo $ADMIN_RESPONSE | grep -q "token"; then
    echo "✓ Admin authentication test passed"
else
    echo "⚠ Admin authentication not available (expected if rolled back)"
fi

echo "=== VERIFICATION COMPLETED ==="
```

### 2. Performance Testing

```bash
#!/bin/bash
# performance-test-rollback.sh

echo "Running performance tests after rollback..."

# Load testing
artillery quick --count 10 --num 50 http://localhost:5000/api/health

# Memory usage check
MEMORY_USAGE=$(ps -o pid,ppid,cmd,%mem,%cpu --sort=-%mem -p $(pgrep -f verbfy-backend) | tail -n +2)
echo "Memory usage after rollback:"
echo "$MEMORY_USAGE"

# Response time check
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:5000/api/health)
echo "API response time: ${RESPONSE_TIME}s"

if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    echo "✓ Response time acceptable"
else
    echo "⚠ Response time high: ${RESPONSE_TIME}s"
fi
```

## Post-Rollback Actions

### 1. Immediate Actions

```bash
#!/bin/bash
# post-rollback-actions.sh

echo "=== POST-ROLLBACK ACTIONS ==="

# Update monitoring alerts
echo "Updating monitoring configuration..."
cp /opt/verbfy/config/monitoring/rollback-alerts.json /opt/verbfy/monitoring/alerts.json

# Clear application caches
echo "Clearing caches..."
redis-cli FLUSHALL

# Update load balancer configuration
echo "Updating load balancer..."
# Add your load balancer update commands here

# Notify external services
echo "Notifying external services..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"event":"rollback_completed","timestamp":"'$(date -Iseconds)'"}'

# Update DNS (if needed)
echo "Checking DNS configuration..."
# Add DNS update commands if needed

echo "=== POST-ROLLBACK ACTIONS COMPLETED ==="
```

### 2. Communication Plan

```bash
#!/bin/bash
# notify-rollback.sh

ROLLBACK_REASON=$1
ROLLBACK_VERSION=$2

# Notify stakeholders
cat << EOF > /tmp/rollback-notification.txt
Subject: Verbfy System Rollback Completed

Dear Team,

A system rollback has been completed for the Verbfy platform.

Details:
- Rollback Time: $(date)
- Reason: $ROLLBACK_REASON
- Rolled back to version: $ROLLBACK_VERSION
- System Status: Operational

The system is now running on the previous stable version. All core functionality has been restored.

Next Steps:
1. Monitor system performance
2. Investigate root cause of the issue
3. Plan for re-deployment with fixes

Best regards,
DevOps Team
EOF

# Send notification (configure your notification method)
# mail -s "Verbfy Rollback Completed" team@verbfy.com < /tmp/rollback-notification.txt
```

### 3. Documentation Update

```bash
#!/bin/bash
# update-rollback-docs.sh

ROLLBACK_DATE=$(date +%Y-%m-%d)
ROLLBACK_TIME=$(date +%H:%M:%S)

# Log rollback event
cat << EOF >> /opt/verbfy/logs/rollback-history.log
Date: $ROLLBACK_DATE
Time: $ROLLBACK_TIME
Version: $ROLLBACK_VERSION
Reason: $ROLLBACK_REASON
Duration: $ROLLBACK_DURATION
Status: Completed
EOF

# Update system status page
echo "System rolled back to version $ROLLBACK_VERSION on $ROLLBACK_DATE" > /var/www/status/current-status.txt
```

## Troubleshooting

### Common Rollback Issues

#### 1. Database Rollback Failures

```bash
# Check database locks
mongosh --eval "db.currentOp()"

# Check disk space
df -h

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Manual database recovery
mongosh --eval "db.repairDatabase()"
```

#### 2. Application Start Failures

```bash
# Check application logs
pm2 logs verbfy-backend --lines 50

# Check port conflicts
netstat -tulpn | grep :5000

# Check file permissions
ls -la /opt/verbfy/current/

# Manual dependency installation
cd /opt/verbfy/current/backend
rm -rf node_modules
npm ci --production
```

#### 3. Configuration Issues

```bash
# Validate environment variables
cd /opt/verbfy/current/backend
node -e "require('dotenv').config(); console.log(process.env.MONGO_URI)"

# Check configuration syntax
node -c server.js

# Restore default configuration
cp /opt/verbfy/config/default/.env.default /opt/verbfy/current/backend/.env
```

#### 4. Network Issues

```bash
# Check nginx configuration
nginx -t

# Check firewall rules
ufw status

# Check DNS resolution
nslookup your-domain.com

# Test internal connectivity
curl -I http://localhost:5000/api/health
```

### Recovery Procedures

#### 1. Failed Rollback Recovery

```bash
#!/bin/bash
# recover-failed-rollback.sh

echo "Recovering from failed rollback..."

# Stop all services
pm2 stop all

# Restore from emergency backup
EMERGENCY_BACKUP="/backups/emergency/$(date +%Y%m%d)"
if [ -d "$EMERGENCY_BACKUP" ]; then
    echo "Restoring from emergency backup..."
    
    # Restore database
    mongorestore --drop --uri="mongodb://localhost:27017/verbfy" $EMERGENCY_BACKUP/database/verbfy
    
    # Restore application
    rm -rf /opt/verbfy/current
    cp -r $EMERGENCY_BACKUP/application /opt/verbfy/current
    
    # Start services
    pm2 start /opt/verbfy/current/backend/ecosystem.config.js
    
    echo "Emergency recovery completed"
else
    echo "Emergency backup not found, manual intervention required"
    exit 1
fi
```

#### 2. Data Corruption Recovery

```bash
#!/bin/bash
# recover-data-corruption.sh

echo "Recovering from data corruption..."

# Stop application
pm2 stop verbfy-backend

# Check database integrity
mongosh verbfy --eval "db.runCommand({validate: 'users'})"

# Restore from last known good backup
LAST_GOOD_BACKUP=$(ls -t /backups/mongodb/ | head -1)
echo "Restoring from $LAST_GOOD_BACKUP"

mongorestore --drop --uri="mongodb://localhost:27017/verbfy" /backups/mongodb/$LAST_GOOD_BACKUP/verbfy

# Restart application
pm2 start verbfy-backend

echo "Data corruption recovery completed"
```

## Rollback Testing

### 1. Rollback Simulation

```bash
#!/bin/bash
# test-rollback-procedure.sh

echo "=== ROLLBACK SIMULATION TEST ==="

# Create test environment
TEST_ENV="/tmp/verbfy-rollback-test"
mkdir -p $TEST_ENV

# Simulate rollback steps
echo "Testing rollback scripts..."

# Test database rollback script
bash -n rollback-database.sh
echo "✓ Database rollback script syntax OK"

# Test application rollback script
bash -n rollback-application.sh
echo "✓ Application rollback script syntax OK"

# Test verification script
bash -n verify-rollback.sh
echo "✓ Verification script syntax OK"

echo "=== ROLLBACK SIMULATION COMPLETED ==="
```

### 2. Rollback Drill

Schedule regular rollback drills to ensure procedures work correctly:

```bash
#!/bin/bash
# rollback-drill.sh

echo "=== ROLLBACK DRILL ==="
echo "This is a scheduled rollback drill"

# Perform rollback in staging environment
STAGING_ENV=true
DRILL_MODE=true

# Execute rollback procedures
source planned-rollback.sh staging-version

# Verify rollback
source verify-rollback.sh

# Document results
echo "Rollback drill completed at $(date)" >> /opt/verbfy/logs/rollback-drills.log

echo "=== ROLLBACK DRILL COMPLETED ==="
```

## Monitoring and Alerts

### 1. Rollback Monitoring

```bash
#!/bin/bash
# monitor-rollback.sh

# Monitor system health after rollback
while true; do
    # Check application health
    if ! curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "ALERT: Application health check failed after rollback"
        # Send alert
    fi
    
    # Check memory usage
    MEMORY_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
    if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
        echo "ALERT: High memory usage after rollback: ${MEMORY_USAGE}%"
    fi
    
    # Check error rates
    ERROR_COUNT=$(tail -100 /opt/verbfy/logs/combined.log | grep -c ERROR)
    if [ $ERROR_COUNT -gt 10 ]; then
        echo "ALERT: High error rate after rollback: $ERROR_COUNT errors"
    fi
    
    sleep 60
done
```

### 2. Automated Alerts

```javascript
// monitoring/rollback-alerts.js
const nodemailer = require('nodemailer');

class RollbackMonitor {
  constructor() {
    this.alertThresholds = {
      responseTime: 2000, // ms
      errorRate: 5, // errors per minute
      memoryUsage: 80 // percentage
    };
  }

  async sendAlert(type, message) {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: 'alerts@verbfy.com',
      to: 'devops@verbfy.com',
      subject: `Rollback Alert: ${type}`,
      text: message
    });
  }

  async monitorPostRollback() {
    // Implementation for post-rollback monitoring
    setInterval(async () => {
      try {
        const health = await this.checkSystemHealth();
        if (!health.healthy) {
          await this.sendAlert('System Health', health.message);
        }
      } catch (error) {
        await this.sendAlert('Monitor Error', error.message);
      }
    }, 60000);
  }
}

module.exports = RollbackMonitor;
```

---

## Summary

This rollback guide provides comprehensive procedures for safely rolling back the Verbfy Admin Notification System. Key points to remember:

1. **Always assess the situation** before initiating a rollback
2. **Use emergency procedures** only for critical issues
3. **Follow planned procedures** for non-critical issues
4. **Verify the rollback** thoroughly before declaring success
5. **Document everything** for future reference
6. **Test rollback procedures** regularly

For emergency situations, contact:
- **DevOps Team**: devops@verbfy.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX
- **Slack Channel**: #emergency-response

**Last Updated**: [Current Date]
**Version**: 1.0.0
**Maintainer**: Verbfy DevOps Team