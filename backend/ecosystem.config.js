const path = require('path');

module.exports = {
  apps: [{
    name: 'verbfy-backend',
    script: 'dist/index.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      // Non-sensitive environment variables only
      // Sensitive variables (JWT_SECRET, MONGO_URI, etc.) will be loaded from .env file
    },
    env_file: '.env.production',
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster', // Better performance with cluster mode
    watch: false,
    max_memory_restart: '768M', // Increased for better performance
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    restart_delay: 2000, // Faster restart
    max_restarts: 15, // More restart attempts
    min_uptime: '30s', // Longer minimum uptime
    autorestart: true,
    cron_restart: '0 2 * * *', // Restart daily at 2 AM
    ignore_watch: ['node_modules', 'logs', 'dist'],
    source_map_support: false,
    node_args: [
      '--max-old-space-size=768',
      '--optimize-for-size',
      '--gc-interval=100',
      '--max-semi-space-size=64'
    ].join(' '),
    kill_timeout: 3000, // Faster kill timeout
    wait_ready: true,
    listen_timeout: 10000, // Longer listen timeout
    shutdown_with_message: true,
    // Additional performance optimizations
    increment_var: 'PORT',
    combine_logs: true,
    force: true,
    // Health monitoring
    health_check_grace_period: 5000,
    health_check_fatal_exceptions: true,
    // Socket.IO clustering support
    instance_var: 'INSTANCE_ID',
    // Log rotation
    log_type: 'json',
    // Memory monitoring
    monitoring: false, // Disable PM2 monitoring to save resources
    pmx: false,
    // Performance optimizations
    vizion: false, // Disable version control features
    autorestart: true,
    watch_delay: 1000,
    // CPU and memory limits
    max_cpu_percent: 80,
    // Graceful shutdown
    kill_retry_time: 100
  }],
  
  deploy: {
    production: {
      user: 'root',
      host: '46.62.161.121',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/verbfy-backend.git',
      path: '/root/Verbfy/backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
