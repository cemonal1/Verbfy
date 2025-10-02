const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection - use the same URI as the main app
const MONGO_URI = process.env.MONGO_URI;

// User model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  isApproved: { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  refreshTokenVersion: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    // Connect to MongoDB
    const mongoUri = MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/verbfy';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@verbfy.com' });
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('test123', 12);

    // Create test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@verbfy.com',
      password: hashedPassword,
      role: 'student',
      isApproved: true,
      approvalStatus: 'approved'
    });

    await testUser.save();
    console.log('✅ Test user created successfully:');
    console.log('   Email: test@verbfy.com');
    console.log('   Password: test123');
    console.log('   Role: student');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createTestUser();