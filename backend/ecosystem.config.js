const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  apps: [
    {
      name: 'verbfy-backend',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5000,
        MONGO_URI: process.env.MONGO_URI,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        FRONTEND_URL: process.env.FRONTEND_URL,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
        LIVEKIT_CLOUD_URL: process.env.LIVEKIT_CLOUD_URL,
        LIVEKIT_CLOUD_API_KEY: process.env.LIVEKIT_CLOUD_API_KEY,
        LIVEKIT_CLOUD_API_SECRET: process.env.LIVEKIT_CLOUD_API_SECRET,
        SESSION_SECRET: process.env.SESSION_SECRET,
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        REDIS_URL: process.env.REDIS_URL,
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        SENTRY_DSN: process.env.SENTRY_DSN
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Auto restart on crash
      autorestart: true,
      // Restart delay
      restart_delay: 4000,
      // Max restart attempts
      max_restarts: 10,
      // Min uptime before considering stable
      min_uptime: '10s',
      // Health check
      health_check_grace_period: 3000,
      // Kill timeout
      kill_timeout: 5000,
      // Listen timeout
      listen_timeout: 8000,
      // Graceful shutdown
      shutdown_with_message: true,
      // Environment variables validation
      validate_env: true,
      // Node options
      node_args: [
        '--max-old-space-size=1024',
        '--optimize-for-size',
        '--gc-interval=100'
      ]
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: '46.62.161.121',
      ref: 'origin/main',
      repo: 'https://github.com/cemonal1/Verbfy.git',
      path: '/root/Verbfy',
      'pre-deploy-local': '',
      'post-deploy': [
        'cd backend',
        'npm install --production',
        'npm run build',
        'pm2 reload ecosystem.config.js --env production',
        'pm2 save'
      ],
      'pre-setup': '',
      'post-setup': [
        'cd backend',
        'npm install --production',
        'npm run build'
      ]
    }
  },

  // PM2 configuration
  pm2: {
    // Save PM2 configuration
    save: true,
    // PM2 home directory
    home: path.join(__dirname, '.pm2'),
    // PM2 log directory
    log_dir: path.join(__dirname, 'logs'),
    // PM2 pid file
    pid_file: path.join(__dirname, '.pm2', 'pm2.pid'),
    // PM2 log file
    log_file: path.join(__dirname, '.pm2', 'pm2.log'),
    // PM2 error log file
    error_file: path.join(__dirname, '.pm2', 'pm2-error.log'),
    // PM2 out log file
    out_file: path.join(__dirname, '.pm2', 'pm2-out.log')
  }
};
