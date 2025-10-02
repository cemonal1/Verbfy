#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');

// Memory monitoring configuration
const MEMORY_THRESHOLD = 0.85; // 85% memory usage threshold
const CHECK_INTERVAL = 30000; // Check every 30 seconds
const LOG_FILE = path.join(__dirname, '../logs/memory.log');

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function getMemoryInfo() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = (usedMemory / totalMemory);
  
  // Process memory info
  const processMemory = process.memoryUsage();
  
  return {
    system: {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usagePercent: memoryUsagePercent
    },
    process: {
      rss: processMemory.rss,
      heapTotal: processMemory.heapTotal,
      heapUsed: processMemory.heapUsed,
      external: processMemory.external,
      arrayBuffers: processMemory.arrayBuffers
    },
    timestamp: new Date().toISOString()
  };
}

function logMemoryInfo(memInfo) {
  const logEntry = {
    timestamp: memInfo.timestamp,
    system: {
      total: formatBytes(memInfo.system.total),
      used: formatBytes(memInfo.system.used),
      free: formatBytes(memInfo.system.free),
      usagePercent: (memInfo.system.usagePercent * 100).toFixed(2) + '%'
    },
    process: {
      rss: formatBytes(memInfo.process.rss),
      heapTotal: formatBytes(memInfo.process.heapTotal),
      heapUsed: formatBytes(memInfo.process.heapUsed),
      external: formatBytes(memInfo.process.external),
      arrayBuffers: formatBytes(memInfo.process.arrayBuffers)
    }
  };
  
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(LOG_FILE, logLine);
  
  // Console output for immediate feedback
  console.log(`[${memInfo.timestamp}] Memory Usage: ${logEntry.system.usagePercent} | Process RSS: ${logEntry.process.rss}`);
  
  // Alert if memory usage is high
  if (memInfo.system.usagePercent > MEMORY_THRESHOLD) {
    console.warn(`⚠️  HIGH MEMORY USAGE DETECTED: ${logEntry.system.usagePercent}`);
    
    // Trigger garbage collection if available
    if (global.gc) {
      console.log('🗑️  Triggering garbage collection...');
      global.gc();
    }
  }
}

function startMonitoring() {
  console.log(`🔍 Starting memory monitoring (interval: ${CHECK_INTERVAL}ms, threshold: ${MEMORY_THRESHOLD * 100}%)`);
  console.log(`📝 Logging to: ${LOG_FILE}`);
  
  // Initial check
  const initialMemInfo = getMemoryInfo();
  logMemoryInfo(initialMemInfo);
  
  // Set up interval monitoring
  setInterval(() => {
    const memInfo = getMemoryInfo();
    logMemoryInfo(memInfo);
  }, CHECK_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Memory monitoring stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Memory monitoring terminated');
  process.exit(0);
});

// Start monitoring if this script is run directly
if (require.main === module) {
  startMonitoring();
}

module.exports = {
  getMemoryInfo,
  logMemoryInfo,
  startMonitoring,
  MEMORY_THRESHOLD,
  CHECK_INTERVAL
};