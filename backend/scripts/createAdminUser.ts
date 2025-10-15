#!/usr/bin/env ts-node

/**
 * Admin User Creation Script (TypeScript)
 * 
 * This script creates an initial admin user for the Verbfy platform.
 * It uses the existing models and utilities from the main application.
 * 
 * Usage:
 *   npx ts-node scripts/createAdminUser.ts
 *   npm run create-admin
 *   
 * Environment Variables:
 *   ADMIN_EMAIL - Email for the admin user (required)
 *   ADMIN_PASSWORD - Password for the admin user (required)
 *   ADMIN_NAME - Name for the admin user (optional, defaults to "System Administrator")
 *   MONGODB_URI - MongoDB connection string (required)
 * 
 * Last Updated: 2025-10-15 - Added Hetzner deployment support
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';
import UserModel from '../src/models/User';
import { connectDB } from '../src/config/db';
import { createLogger } from '../src/utils/logger';

// Load environment variables
dotenv.config();

const logger = createLogger('admin-seed');

interface AdminUserData {
  name: string;
  email: string;
  password: string;
}

// Utility functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const promptUser = (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

const promptPassword = (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
    // Hide password input - using proper interface extension
    const mutableRl = rl as any;
    mutableRl.stdoutMuted = true;
    mutableRl._writeToOutput = function _writeToOutput(stringToWrite: string) {
      if (mutableRl.stdoutMuted) {
        process.stdout.write("*");
      } else {
        process.stdout.write(stringToWrite);
      }
    };
  });
};

const createAdminUser = async (): Promise<void> => {
  try {
    console.log('🔧 Verbfy Admin User Creation Script (TypeScript)');
    console.log('================================================\n');

    // Get admin details from environment or prompt
    let adminEmail = process.env.ADMIN_EMAIL;
    let adminPassword = process.env.ADMIN_PASSWORD;
    let adminName = process.env.ADMIN_NAME || 'System Administrator';

    // Interactive mode if environment variables not provided
    if (!adminEmail) {
      adminEmail = await promptUser('Enter admin email: ');
    }

    if (!adminPassword) {
      adminPassword = await promptPassword('Enter admin password (hidden): ');
      console.log(); // New line after password input
    }

    if (!adminName || adminName === 'System Administrator') {
      const inputName = await promptUser(`Enter admin name (default: ${adminName}): `);
      if (inputName) {
        adminName = inputName;
      }
    }

    // Validate inputs
    if (!validateEmail(adminEmail)) {
      logger.error('Invalid email format provided');
      console.error('❌ Error: Invalid email format');
      process.exit(1);
    }

    if (!validatePassword(adminPassword)) {
      logger.error('Password does not meet security requirements');
      console.error('❌ Error: Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      process.exit(1);
    }

    // Check if admin user already exists
    const existingUser = await UserModel.findOne({ email: adminEmail.toLowerCase() });
    
    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log('⚠️  Admin user with this email already exists');
        logger.info('Admin user already exists', { email: adminEmail });
        
        const updateChoice = await promptUser('Do you want to update the password? (y/N): ');
        if (updateChoice.toLowerCase() === 'y' || updateChoice.toLowerCase() === 'yes') {
          const hashedPassword = await hashPassword(adminPassword);
          await UserModel.findByIdAndUpdate(existingUser._id, {
            password: hashedPassword,
            name: adminName,
            updatedAt: new Date()
          });
          
          logger.info('Admin user password updated', { 
            userId: existingUser._id,
            email: adminEmail 
          });
          console.log('✅ Admin user password updated successfully');
        } else {
          console.log('ℹ️  No changes made');
        }
        return;
      } else {
        console.log('⚠️  User with this email exists but is not an admin');
        logger.info('Non-admin user found with email', { 
          email: adminEmail, 
          currentRole: existingUser.role 
        });
        
        const promoteChoice = await promptUser('Do you want to promote this user to admin? (y/N): ');
        if (promoteChoice.toLowerCase() === 'y' || promoteChoice.toLowerCase() === 'yes') {
          const hashedPassword = await hashPassword(adminPassword);
          await UserModel.findByIdAndUpdate(existingUser._id, {
            role: 'admin',
            password: hashedPassword,
            name: adminName,
            isActive: true,
            emailVerified: true,
            updatedAt: new Date()
          });
          
          logger.info('User promoted to admin', { 
            userId: existingUser._id,
            email: adminEmail,
            previousRole: existingUser.role 
          });
          console.log('✅ User promoted to admin successfully');
        } else {
          console.log('ℹ️  No changes made');
        }
        return;
      }
    }

    // Create new admin user
    const hashedPassword = await hashPassword(adminPassword);
    
    const adminUserData: AdminUserData = {
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: hashedPassword
    };

    const adminUser = new UserModel({
      ...adminUserData,
      role: 'admin',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedUser = await adminUser.save();

    logger.info('Admin user created successfully', {
      userId: savedUser._id,
      email: adminEmail,
      name: adminName
    });

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`👤 Name: ${adminName}`);
    console.log(`🔑 Role: admin`);
    console.log(`🆔 User ID: ${savedUser._id}`);
    console.log(`📅 Created: ${new Date().toISOString()}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error creating admin user', { error: errorMessage });
    console.error('❌ Error creating admin user:', errorMessage);
    
    if ((error as any).code === 11000) {
      console.error('This email is already registered in the system');
    }
    
    process.exit(1);
  }
};

const main = async (): Promise<void> => {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Connected to database');
    
    await createAdminUser();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Script failed', { error: errorMessage });
    console.error('❌ Script failed:', errorMessage);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
    process.exit(0);
  }
};

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Script interrupted by user');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Script terminated');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { createAdminUser, main };