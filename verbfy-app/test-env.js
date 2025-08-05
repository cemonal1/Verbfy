// Test environment variables loading
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Frontend Environment Variables...\n');

console.log('📋 Environment Variables:');
console.log('========================');

const envVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_LIVEKIT_URL',
  'NEXT_PUBLIC_LIVEKIT_CLOUD_URL'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`❌ ${varName}: Missing`);
  }
});

console.log('\n🎯 Expected Values:');
console.log('NEXT_PUBLIC_API_URL=http://localhost:5001');
console.log('NEXT_PUBLIC_LIVEKIT_URL=wss://localhost:7880');
console.log('NEXT_PUBLIC_LIVEKIT_CLOUD_URL=wss://localhost:7880'); 