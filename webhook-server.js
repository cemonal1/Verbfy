#!/usr/bin/env node

/**
 * Verbfy GitHub Webhook Server
 * GitHub'dan gelen webhook'ları dinler ve otomatik deployment tetikler
 */

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Konfigürasyon
const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'verbfy-webhook-secret';
const PROJECT_DIR = process.env.PROJECT_DIR || '/root/Verbfy';
const LOG_FILE = '/var/log/verbfy-webhook.log';

// Log fonksiyonu
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(LOG_FILE, logMessage);
}

// Webhook signature doğrulama
function verifySignature(payload, signature) {
    const hmac = crypto.createHmac('sha256', SECRET);
    hmac.update(payload);
    const calculatedSignature = `sha256=${hmac.digest('hex')}`;
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
    );
}

// Deployment çalıştırma
function runDeployment() {
    return new Promise((resolve, reject) => {
        const deployScript = path.join(PROJECT_DIR, 'auto-deploy-server.sh');
        
        log('🚀 Starting deployment...');
        
        exec(`cd ${PROJECT_DIR} && bash ${deployScript}`, (error, stdout, stderr) => {
            if (error) {
                log(`❌ Deployment failed: ${error.message}`);
                reject(error);
                return;
            }
            
            if (stderr) {
                log(`⚠️ Deployment stderr: ${stderr}`);
            }
            
            log(`✅ Deployment completed: ${stdout}`);
            resolve(stdout);
        });
    });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hub-Signature-256');

    // OPTIONS request için
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Health check endpoint
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            service: 'verbfy-webhook',
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // Webhook endpoint
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                // Signature doğrulama
                const signature = req.headers['x-hub-signature-256'];
                if (!signature || !verifySignature(body, signature)) {
                    log('❌ Invalid webhook signature');
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid signature' }));
                    return;
                }

                // Payload parse etme
                const payload = JSON.parse(body);
                
                log(`📥 Webhook received: ${payload.ref} by ${payload.pusher?.name || 'unknown'}`);
                
                // Sadece main branch için deployment yap
                if (payload.ref === 'refs/heads/main') {
                    log('🎯 Main branch push detected, starting deployment...');
                    
                    try {
                        await runDeployment();
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            status: 'success',
                            message: 'Deployment started successfully',
                            timestamp: new Date().toISOString()
                        }));
                        
                        log('✅ Webhook processed successfully');
                    } catch (error) {
                        log(`❌ Deployment error: ${error.message}`);
                        
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            status: 'error',
                            message: 'Deployment failed',
                            error: error.message,
                            timestamp: new Date().toISOString()
                        }));
                    }
                } else {
                    log(`ℹ️ Ignoring push to ${payload.ref}`);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'ignored',
                        message: 'Not main branch, deployment skipped',
                        timestamp: new Date().toISOString()
                    }));
                }
                
            } catch (error) {
                log(`❌ Webhook processing error: ${error.message}`);
                
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'error',
                    message: 'Invalid payload',
                    error: error.message,
                    timestamp: new Date().toISOString()
                }));
            }
        });
        
        return;
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'error',
        message: 'Not found',
        timestamp: new Date().toISOString()
    }));
});

// Server başlatma
server.listen(PORT, () => {
    log(`🎣 Verbfy Webhook Server started on port ${PORT}`);
    log(`📍 Webhook URL: http://46.62.161.121:${PORT}/webhook`);
    log(`🏥 Health check: http://46.62.161.121:${PORT}/health`);
    log(`📝 Logs: ${LOG_FILE}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    log('🛑 Webhook server shutting down...');
    server.close(() => {
        log('✅ Webhook server stopped');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    log('🛑 Webhook server interrupted...');
    server.close(() => {
        log('✅ Webhook server stopped');
        process.exit(0);
    });
});

// Unhandled errors
process.on('uncaughtException', (error) => {
    log(`💥 Uncaught exception: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`💥 Unhandled rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
});