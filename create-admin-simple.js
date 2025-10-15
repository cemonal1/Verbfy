const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Connect to MongoDB using the same URI as the backend
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable not found');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Define User schema (simplified)
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['user', 'admin'], default: 'user' },
      isActive: { type: Boolean, default: true },
      emailVerified: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });
    
    const User = mongoose.model('User', userSchema);
    
    const adminEmail = 'admin@verbfy.com';
    const adminPassword = 'VerbfyAdmin931336&';
    const adminName = 'System Administrator';
    
    // Check if admin already exists
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    
    if (existingUser) {
      console.log('⚠️  Admin user already exists');
      if (existingUser.role === 'admin') {
        console.log('✅ Admin user is already configured');
      } else {
        // Promote to admin
        await User.findByIdAndUpdate(existingUser._id, {
          role: 'admin',
          isActive: true,
          emailVerified: true,
          updatedAt: new Date()
        });
        console.log('✅ User promoted to admin');
      }
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
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
      
      const savedUser = await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`👤 Name: ${adminName}`);
      console.log(`🆔 User ID: ${savedUser._id}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

createAdmin();