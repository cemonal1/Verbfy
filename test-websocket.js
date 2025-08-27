#!/usr/bin/env node

/**
 * WebSocket Connection Test Script
 * Tests the VerbfyTalk WebSocket endpoint
 */

const WebSocket = require('ws');
const https = require('https');

const BACKEND_URL = 'https://api.verbfy.com';
const VERBFY_TALK_PATH = '/verbfy-talk';

console.log('🧪 Testing WebSocket connections...\n');

// Test 1: Basic WebSocket connection to VerbfyTalk
function testVerbfyTalkWebSocket() {
  return new Promise((resolve, reject) => {
    console.log('🔌 Testing VerbfyTalk WebSocket connection...');
    
    const wsUrl = `wss://api.verbfy.com${VERBFY_TALK_PATH}/?EIO=4&transport=websocket`;
    console.log('📡 Connecting to:', wsUrl);
    
    const ws = new WebSocket(wsUrl, {
      headers: {
        'Origin': 'https://www.verbfy.com',
        'User-Agent': 'VerbfyTalk-Test/1.0'
      }
    });

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Connection timeout after 10 seconds'));
    }, 10000);

    ws.on('open', () => {
      console.log('✅ VerbfyTalk WebSocket connection established');
      clearTimeout(timeout);
      ws.close();
      resolve();
    });

    ws.on('error', (error) => {
      console.log('❌ VerbfyTalk WebSocket connection failed:', error.message);
      clearTimeout(timeout);
      reject(error);
    });

    ws.on('close', (code, reason) => {
      console.log(`🔌 VerbfyTalk WebSocket closed: ${code} - ${reason}`);
    });
  });
}

// Test 2: HTTP health check
function testHealthCheck() {
  return new Promise((resolve, reject) => {
    console.log('🏥 Testing health check endpoint...');
    
    const options = {
      hostname: 'api.verbfy.com',
      port: 443,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Origin': 'https://www.verbfy.com'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Health check response:', response.status);
          resolve(response);
        } catch (error) {
          console.log('❌ Failed to parse health check response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Health check failed:', error.message);
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });

    req.end();
  });
}

// Test 3: CORS test
function testCorsEndpoint() {
  return new Promise((resolve, reject) => {
    console.log('🌐 Testing CORS endpoint...');
    
    const options = {
      hostname: 'api.verbfy.com',
      port: 443,
      path: '/api/cors-test',
      method: 'GET',
      headers: {
        'Origin': 'https://www.verbfy.com'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ CORS test response:', response);
          resolve(response);
        } catch (error) {
          console.log('❌ Failed to parse CORS test response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ CORS test failed:', error.message);
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('CORS test timeout'));
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  const results = {
    healthCheck: false,
    corsTest: false,
    websocket: false
  };

  try {
    await testHealthCheck();
    results.healthCheck = true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  try {
    await testCorsEndpoint();
    results.corsTest = true;
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
  }

  try {
    await testVerbfyTalkWebSocket();
    results.websocket = true;
  } catch (error) {
    console.log('❌ WebSocket test failed:', error.message);
  }

  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`Health Check: ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CORS Test: ${results.corsTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WebSocket: ${results.websocket ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result);
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (!allPassed) {
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Check if the backend server is running on port 5000');
    console.log('2. Verify Nginx configuration is correct');
    console.log('3. Check SSL certificates are valid');
    console.log('4. Ensure WebSocket upgrade headers are properly set');
    console.log('5. Check firewall settings');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
