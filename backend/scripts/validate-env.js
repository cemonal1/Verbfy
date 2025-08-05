#!/usr/bin/env node

/**
 * Environment validation script
 * Run this script before deployment to ensure all required environment variables are configured
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Required environment variables
const requiredEnvVars = {
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

// Load environment variables
require('dotenv').config();

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');
  
  const missingVars = [];
  const invalidVars = [];
  const warnings = [];
  
  // Check required environment variables
  for (const [varName, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName];
    
    if (config.required && !value) {
      missingVars.push({ name: varName, ...config });
    } else if (value && config.example && value === config.example) {
      invalidVars.push({ name: varName, ...config });
    }
  }
  
  // Validate specific variables
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (jwtSecret && jwtSecret.length < 32) {
    warnings.push('JWT_SECRET must be at least 32 characters long');
  }
  
  if (jwtRefreshSecret && jwtRefreshSecret.length < 32) {
    warnings.push('JWT_REFRESH_SECRET must be at least 32 characters long');
  }
  
  if (jwtSecret === jwtRefreshSecret && jwtSecret) {
    warnings.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }
  
  // Validate MongoDB URI
  const mongoUri = process.env.MONGO_URI;
  if (mongoUri && !mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    warnings.push('MONGO_URI must be a valid MongoDB connection string');
  }
  
  // Validate Frontend URL
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    try {
      new URL(frontendUrl);
    } catch {
      warnings.push('FRONTEND_URL must be a valid URL');
    }
  }
  
  // Report results
  let hasErrors = false;
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(({ name, description, example }) => {
      console.error(`   - ${name}: ${description}`);
      if (example) {
        console.error(`     Example: ${example}`);
      }
    });
    console.error('');
    hasErrors = true;
  }
  
  if (invalidVars.length > 0) {
    console.warn('⚠️  Environment variables using example values:');
    invalidVars.forEach(({ name, description }) => {
      console.warn(`   - ${name}: ${description} (Please replace with actual value)`);
    });
    console.warn('');
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Validation warnings:');
    warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
    console.warn('');
  }
  
  if (!hasErrors) {
    console.log('✅ Environment validation passed!');
    console.log('');
    console.log('📋 Environment Summary:');
    console.log(`   - Node Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   - Port: ${process.env.PORT || '5000'}`);
    console.log(`   - Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
    console.log(`   - Database: ${process.env.MONGO_URI ? 'Configured' : 'Not configured'}`);
    console.log(`   - JWT Secrets: ${jwtSecret && jwtRefreshSecret ? 'Configured' : 'Not configured'}`);
  } else {
    console.error('❌ Environment validation failed!');
    process.exit(1);
  }
}

// Generate secure secrets
function generateSecrets() {
  console.log('🔐 Generating secure JWT secrets...\n');
  
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
  
  console.log('Generated JWT_SECRET:');
  console.log(jwtSecret);
  console.log('');
  console.log('Generated JWT_REFRESH_SECRET:');
  console.log(jwtRefreshSecret);
  console.log('');
  console.log('📝 Add these to your .env file:');
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'generate-secrets':
    generateSecrets();
    break;
  case 'validate':
  default:
    validateEnvironment();
    break;
}

// Export for use in other scripts
module.exports = { validateEnvironment, generateSecrets }; 