/**
 * Environment validation module
 * Ensures all required environment variables are properly configured
 */

interface RequiredEnvVars {
  [key: string]: {
    required: boolean;
    description: string;
    example?: string;
  };
}

const requiredEnvVars: RequiredEnvVars = {
  MONGO_URI: {
    required: true,
    description: 'MongoDB connection string',
    example: 'mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority'
  },
  JWT_SECRET: {
    required: true,
    description: 'JWT secret key for signing access tokens',
    example: 'your-super-secret-jwt-key-here-make-it-long-and-random-32-chars'
  },
  JWT_REFRESH_SECRET: {
    required: true,
    description: 'JWT secret key for signing refresh tokens',
    example: 'your-super-secret-refresh-jwt-key-here-make-it-long-and-random-32-chars'
  },
  FRONTEND_URL: {
    required: true,
    description: 'Frontend application URL',
    example: 'https://verbfy.com'
  },
  PORT: {
    required: false,
    description: 'Server port (defaults to 5000)',
    example: '5000'
  },
  NODE_ENV: {
    required: false,
    description: 'Node environment (defaults to development)',
    example: 'production'
  }
};

export const validateEnvironment = (): void => {
  const missingVars: string[] = [];
  const invalidVars: string[] = [];

  console.log('🔍 Validating environment variables...');

  // Check required environment variables
  for (const [varName, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName];
    
    if (config.required && !value) {
      missingVars.push(varName);
    } else if (value && config.example && value === config.example) {
      invalidVars.push(varName);
    }
  }

  // Report missing variables
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      const config = requiredEnvVars[varName];
      console.error(`   - ${varName}: ${config.description}`);
      if (config.example) {
        console.error(`     Example: ${config.example}`);
      }
    });
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Report invalid variables (using example values)
  if (invalidVars.length > 0) {
    console.warn('⚠️  Environment variables using example values:');
    invalidVars.forEach(varName => {
      const config = requiredEnvVars[varName];
      console.warn(`   - ${varName}: Please replace with actual value`);
    });
  }

  // Validate specific variables
  validateJWTSecrets();
  validateMongoURI();
  validateFrontendURL();

  // Recommended variables (warn-only)
  const recommended = ['SENTRY_DSN', 'STRIPE_SECRET_KEY'];
  for (const v of recommended) {
    if (!process.env[v]) {
      console.warn(`⚠️  Recommended env var missing: ${v}`);
    }
  }

  // LiveKit Cloud configuration validation
  validateLiveKitConfig();

  console.log('✅ Environment validation passed');
};

const validateJWTSecrets = (): void => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (jwtSecret && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (jwtRefreshSecret && jwtRefreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  if (jwtSecret === jwtRefreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }
};

const validateMongoURI = (): void => {
  const mongoUri = process.env.MONGO_URI;
  
  if (mongoUri && !mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    throw new Error('MONGO_URI must be a valid MongoDB connection string');
  }
};

const validateFrontendURL = (): void => {
  const frontendUrl = process.env.FRONTEND_URL;
  
  if (frontendUrl) {
    try {
      new URL(frontendUrl);
    } catch {
      throw new Error('FRONTEND_URL must be a valid URL');
    }
  }
};

const validateLiveKitConfig = (): void => {
  const cloudApiKey = process.env.LIVEKIT_CLOUD_API_KEY;
  const cloudApiSecret = process.env.LIVEKIT_CLOUD_API_SECRET;
  const cloudUrl = process.env.LIVEKIT_CLOUD_URL;
  
  const selfApiKey = process.env.LIVEKIT_SELF_API_KEY;
  const selfApiSecret = process.env.LIVEKIT_SELF_API_SECRET;
  const selfUrl = process.env.LIVEKIT_SELF_URL;

  // Check if either Cloud or Self-hosted is configured
  const hasCloudConfig = cloudApiKey && cloudApiSecret && cloudUrl;
  const hasSelfConfig = selfApiKey && selfApiSecret && selfUrl;

  if (!hasCloudConfig && !hasSelfConfig) {
    console.warn('⚠️ Missing LiveKit configuration: Either Cloud or Self-hosted must be configured');
    console.warn('   - For Cloud: LIVEKIT_CLOUD_API_KEY, LIVEKIT_CLOUD_API_SECRET, LIVEKIT_CLOUD_URL');
    console.warn('   - For Self-hosted: LIVEKIT_SELF_API_KEY, LIVEKIT_SELF_API_SECRET, LIVEKIT_SELF_URL');
  } else if (hasCloudConfig) {
    console.log('✅ LiveKit Cloud configuration found');
    if (!cloudUrl.startsWith('wss://')) {
      console.warn('⚠️ LIVEKIT_CLOUD_URL should start with wss:// for secure WebSocket connection');
    }
  } else if (hasSelfConfig) {
    console.log('✅ LiveKit Self-hosted configuration found');
    if (!selfUrl.startsWith('wss://')) {
      console.warn('⚠️ LIVEKIT_SELF_URL should start with wss:// for secure WebSocket connection');
    }
  }
};

export const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  
  return value || defaultValue!;
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}; 