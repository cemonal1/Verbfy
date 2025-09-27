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
    env_file: '.env',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    autorestart: true,
    cron_restart: '0 2 * * *', // Restart daily at 2 AM
    ignore_watch: ['node_modules', 'logs', 'dist'],
    source_map_support: false,
    node_args: '--max-old-space-size=1024',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 8000,
    shutdown_with_message: true
  }],
  
  deploy: {
    production: {
      user: 'root',
      host: 'api.verbfy.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/verbfy-backend.git',
      path: '/root/Verbfy/backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
