// LiveKit Configuration Test
require('dotenv').config();

console.log('🧪 Testing LiveKit Configuration...\n');

// Test environment variables
const requiredVars = [
  'LIVEKIT_CLOUD_API_KEY',
  'LIVEKIT_CLOUD_API_SECRET',
  'LIVEKIT_CLOUD_URL',
  'LIVEKIT_SELF_API_KEY',
  'LIVEKIT_SELF_API_SECRET',
  'LIVEKIT_SELF_URL'
];

console.log('📋 Environment Variables Check:');
console.log('==============================');

let allVarsPresent = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    allVarsPresent = false;
  }
});

console.log('');

if (!allVarsPresent) {
  console.log('❌ Some environment variables are missing!');
  console.log('Please check your .env file and ensure all LiveKit variables are set.');
  process.exit(1);
}

// Test LiveKit token generation
console.log('🔑 Testing LiveKit Token Generation:');
console.log('===================================');

try {
  const { AccessToken } = require('livekit-server-sdk');
  
  const apiKey = process.env.LIVEKIT_CLOUD_API_KEY;
  const apiSecret = process.env.LIVEKIT_CLOUD_API_SECRET;
  
  const at = new AccessToken(apiKey, apiSecret, {
    identity: 'test-user-123',
    name: 'Test User'
  });

  at.addGrant({
    room: 'test-room',
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true
  });

  const token = at.toJwt();
  console.log('✅ Token generated successfully');
  console.log(`📋 Token preview: ${token.substring(0, 50)}...`);
  
} catch (error) {
  console.log('❌ Token generation failed:', error.message);
  process.exit(1);
}

console.log('');
console.log('🎉 LiveKit Configuration Test Passed!');
console.log('');
console.log('📝 Next Steps:');
console.log('1. Start LiveKit server: ../start-livekit.bat (Windows) or ../start-livekit.sh (Linux/Mac)');
console.log('2. Start backend server: npm run dev');
console.log('3. Start frontend server: cd ../verbfy-app && npm run dev');
console.log('4. Test video conferencing in your application'); 