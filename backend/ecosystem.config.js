const path = require('path');

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
        PORT: 5000
        // ⚠️ SECRET'LAR .env DOSYASINDAN OTOMATIK YÜKLENİR
        // Bu dosyada secret'ları yazmıyoruz!
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
