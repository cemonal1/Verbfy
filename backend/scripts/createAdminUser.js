#!/usr/bin/env node

/**
 * Admin User Creation Script
 * 
 * This script creates an initial admin user for the Verbfy platform.
 * It can be run during deployment or manually when needed.
 * 
 * Usage:
 *   node scripts/createAdminUser.js
 *   
 * Environment Variables:
 *   ADMIN_EMAIL - Email for the admin user (required)
 *   ADMIN_PASSWORD - Password for the admin user (required)
 *   ADMIN_NAME - Name for the admin user (optional, defaults to "System Administrator")
 *   MONGODB_URI - MongoDB connection string (required)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// User schema (simplified version for script)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Utility functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const promptUser = (question) => {
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

const promptPassword = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
    rl.stdoutMuted = true;
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted) {
        rl.output.write("*");
      } else {
        rl.output.write(stringToWrite);
      }
    };
  });
};

const connectToDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ Error: MONGODB_URI environment variable is required');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const createAdminUser = async () => {
  try {
    console.log('🔧 Verbfy Admin User Creation Script');
    console.log('=====================================\n');

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
      console.error('❌ Error: Invalid email format');
      process.exit(1);
    }

    if (!validatePassword(adminPassword)) {
      console.error('❌ Error: Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      process.exit(1);
    }

    // Check if admin user already exists
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log('⚠️  Admin user with this email already exists');
        
        const updateChoice = await promptUser('Do you want to update the password? (y/N): ');
        if (updateChoice.toLowerCase() === 'y' || updateChoice.toLowerCase() === 'yes') {
          const hashedPassword = await hashPassword(adminPassword);
          await User.findByIdAndUpdate(existingUser._id, {
            password: hashedPassword,
            name: adminName,
            updatedAt: new Date()
          });
          console.log('✅ Admin user password updated successfully');
        } else {
          console.log('ℹ️  No changes made');
        }
        return;
      } else {
        console.log('⚠️  User with this email exists but is not an admin');
        const promoteChoice = await promptUser('Do you want to promote this user to admin? (y/N): ');
        if (promoteChoice.toLowerCase() === 'y' || promoteChoice.toLowerCase() === 'yes') {
          const hashedPassword = await hashPassword(adminPassword);
          await User.findByIdAndUpdate(existingUser._id, {
            role: 'admin',
            password: hashedPassword,
            name: adminName,
            isActive: true,
            emailVerified: true,
            updatedAt: new Date()
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
    
    const adminUser = new User({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`👤 Name: ${adminName}`);
    console.log(`🔑 Role: admin`);
    console.log(`📅 Created: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 11000) {
      console.error('This email is already registered in the system');
    }
    
    process.exit(1);
  }
};

const main = async () => {
  try {
    await connectToDatabase();
    await createAdminUser();
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
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
  main();
}

module.exports = { createAdminUser, connectToDatabase };