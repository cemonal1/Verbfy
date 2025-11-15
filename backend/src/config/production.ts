import { config } from 'dotenv';

// Load production environment variables
config({ path: '.env.production' });

export const productionConfig = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'production',
  
  // Database Configuration
  mongoUri: process.env.MONGO_URI,
  
  // Security Configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  corsOrigin: process.env.CORS_ORIGIN || 'https://verbfy.com',
  sessionSecret: process.env.SESSION_SECRET,
  
  // LiveKit Configuration
  livekit: {
    cloud: {
      apiKey: process.env.LIVEKIT_CLOUD_API_KEY,
      apiSecret: process.env.LIVEKIT_CLOUD_API_SECRET,
      url: process.env.LIVEKIT_CLOUD_URL,
    },
    self: {
      apiKey: process.env.LIVEKIT_SELF_API_KEY,
      apiSecret: process.env.LIVEKIT_SELF_API_SECRET,
      url: process.env.LIVEKIT_SELF_URL,
    },
  },
  
  // Email Configuration
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  
  // Payment Configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    sentryDsn: process.env.SENTRY_DSN,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  
  // Security Headers
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", "blob:"],
          frameSrc: ["'self'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
    },
  },
};

export default productionConfig; 