#!/usr/bin/env ts-node
/**
 * CSP (Content Security Policy) Audit Script
 *
 * This script audits the codebase for inline scripts and styles that violate CSP nonce requirements
 * Usage: ts-node backend/scripts/csp-audit.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../src/utils/logger';

const auditLogger = createLogger('CSPAudit');

interface AuditResult {
  file: string;
  line: number;
  column: number;
  type: 'inline-script' | 'inline-style' | 'inline-event-handler' | 'unsafe-eval';
  content: string;
  severity: 'error' | 'warning' | 'info';
}

const results: AuditResult[] = [];

// Patterns to detect CSP violations
const CSP_VIOLATION_PATTERNS = {
  // Inline scripts without nonce
  inlineScript: /<script(?![^>]*nonce=)[^>]*>[\s\S]*?<\/script>/gi,

  // Inline event handlers
  inlineEventHandlers: /\s(on\w+)=["'][^"']*["']/gi,

  // Inline styles without nonce
  inlineStyle: /<style(?![^>]*nonce=)[^>]*>[\s\S]*?<\/style>/gi,

  // Style attributes
  styleAttribute: /\sstyle=["'][^"']*["']/gi,

  // eval() usage
  unsafeEval: /\beval\s*\(/g,

  // Function constructor
  functionConstructor: /\bnew\s+Function\s*\(/g,

  // setTimeout/setInterval with string
  timeoutString: /(setTimeout|setInterval)\s*\(\s*["'`]/g,
};

/**
 * Scan a file for CSP violations
 */
function scanFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Check for inline scripts
    let match;
    while ((match = CSP_VIOLATION_PATTERNS.inlineScript.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const snippet = match[0].substring(0, 100).replace(/\n/g, ' ');

      results.push({
        file: filePath,
        line: lineNumber,
        column: match.index - content.lastIndexOf('\n', match.index),
        type: 'inline-script',
        content: snippet,
        severity: 'error'
      });
    }

    // Reset regex
    CSP_VIOLATION_PATTERNS.inlineScript.lastIndex = 0;

    // Check for inline event handlers
    while ((match = CSP_VIOLATION_PATTERNS.inlineEventHandlers.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const snippet = match[0].substring(0, 100);

      results.push({
        file: filePath,
        line: lineNumber,
        column: match.index - content.lastIndexOf('\n', match.index),
        type: 'inline-event-handler',
        content: snippet,
        severity: 'error'
      });
    }

    CSP_VIOLATION_PATTERNS.inlineEventHandlers.lastIndex = 0;

    // Check for inline styles
    while ((match = CSP_VIOLATION_PATTERNS.inlineStyle.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const snippet = match[0].substring(0, 100).replace(/\n/g, ' ');

      results.push({
        file: filePath,
        line: lineNumber,
        column: match.index - content.lastIndexOf('\n', match.index),
        type: 'inline-style',
        content: snippet,
        severity: 'warning'
      });
    }

    CSP_VIOLATION_PATTERNS.inlineStyle.lastIndex = 0;

    // Check for style attributes
    while ((match = CSP_VIOLATION_PATTERNS.styleAttribute.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const snippet = match[0].substring(0, 100);

      results.push({
        file: filePath,
        line: lineNumber,
        column: match.index - content.lastIndexOf('\n', match.index),
        type: 'inline-style',
        content: snippet,
        severity: 'info'
      });
    }

    CSP_VIOLATION_PATTERNS.styleAttribute.lastIndex = 0;

    // Check for eval() usage
    while ((match = CSP_VIOLATION_PATTERNS.unsafeEval.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const snippet = lines[lineNumber - 1]?.trim().substring(0, 100) || '';

      results.push({
        file: filePath,
        line: lineNumber,
        column: match.index - content.lastIndexOf('\n', match.index),
        type: 'unsafe-eval',
        content: snippet,
        severity: 'error'
      });
    }

    CSP_VIOLATION_PATTERNS.unsafeEval.lastIndex = 0;

    // Check for Function constructor
    while ((match = CSP_VIOLATION_PATTERNS.functionConstructor.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const snippet = lines[lineNumber - 1]?.trim().substring(0, 100) || '';

      results.push({
        file: filePath,
        line: lineNumber,
        column: match.index - content.lastIndexOf('\n', match.index),
        type: 'unsafe-eval',
        content: snippet,
        severity: 'error'
      });
    }

    CSP_VIOLATION_PATTERNS.functionConstructor.lastIndex = 0;

    // Check for setTimeout/setInterval with strings
    while ((match = CSP_VIOLATION_PATTERNS.timeoutString.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const snippet = lines[lineNumber - 1]?.trim().substring(0, 100) || '';

      results.push({
        file: filePath,
        line: lineNumber,
        column: match.index - content.lastIndexOf('\n', match.index),
        type: 'unsafe-eval',
        content: snippet,
        severity: 'warning'
      });
    }

    CSP_VIOLATION_PATTERNS.timeoutString.lastIndex = 0;

  } catch (error) {
    auditLogger.error(`Failed to scan file: ${filePath}`, {
      error: error instanceof Error ? error.message : error
    });
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir: string, extensions: string[]): void {
  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      // Skip node_modules, dist, build directories
      if (entry === 'node_modules' || entry === 'dist' || entry === 'build' || entry === '.git') {
        continue;
      }

      if (stat.isDirectory()) {
        scanDirectory(fullPath, extensions);
      } else if (stat.isFile()) {
        const ext = fullPath.split('.').pop();
        if (ext && extensions.includes(ext)) {
          scanFile(fullPath);
        }
      }
    }
  } catch (error) {
    auditLogger.error(`Failed to scan directory: ${dir}`, {
      error: error instanceof Error ? error.message : error
    });
  }
}

/**
 * Generate audit report
 */
function generateReport(): void {
  const errors = results.filter(r => r.severity === 'error');
  const warnings = results.filter(r => r.severity === 'warning');
  const infos = results.filter(r => r.severity === 'info');

  auditLogger.info('='.repeat(80));
  auditLogger.info('CSP AUDIT REPORT');
  auditLogger.info('='.repeat(80));
  auditLogger.info('');
  auditLogger.info(`Total violations found: ${results.length}`);
  auditLogger.info(`  - Errors: ${errors.length}`);
  auditLogger.info(`  - Warnings: ${warnings.length}`);
  auditLogger.info(`  - Info: ${infos.length}`);
  auditLogger.info('');

  if (errors.length > 0) {
    auditLogger.error('ERRORS (Must Fix):');
    auditLogger.error('-'.repeat(80));
    for (const error of errors) {
      auditLogger.error(`[${error.type}] ${error.file}:${error.line}:${error.column}`);
      auditLogger.error(`  ${error.content}`);
      auditLogger.error('');
    }
  }

  if (warnings.length > 0) {
    auditLogger.warn('WARNINGS (Should Fix):');
    auditLogger.warn('-'.repeat(80));
    for (const warning of warnings) {
      auditLogger.warn(`[${warning.type}] ${warning.file}:${warning.line}:${warning.column}`);
      auditLogger.warn(`  ${warning.content}`);
      auditLogger.warn('');
    }
  }

  if (infos.length > 0) {
    auditLogger.info('INFO (Consider Fixing):');
    auditLogger.info('-'.repeat(80));
    for (const info of infos.slice(0, 20)) { // Limit to first 20
      auditLogger.info(`[${info.type}] ${info.file}:${info.line}:${info.column}`);
      auditLogger.info(`  ${info.content}`);
      auditLogger.info('');
    }
    if (infos.length > 20) {
      auditLogger.info(`... and ${infos.length - 20} more info items`);
    }
  }

  auditLogger.info('='.repeat(80));
  auditLogger.info('RECOMMENDATIONS:');
  auditLogger.info('='.repeat(80));
  auditLogger.info('1. Add nonce attribute to inline <script> and <style> tags:');
  auditLogger.info('   <script nonce={cspNonce}>...</script>');
  auditLogger.info('2. Replace inline event handlers with addEventListener:');
  auditLogger.info('   Instead of: <button onclick="...">');
  auditLogger.info('   Use: <button id="myBtn"> + document.getElementById("myBtn").addEventListener(...)');
  auditLogger.info('3. Avoid eval(), new Function(), setTimeout/setInterval with strings');
  auditLogger.info('4. Move inline styles to CSS files or use style-src-elem nonce');
  auditLogger.info('='.repeat(80));

  // Exit with error code if there are errors
  if (errors.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

/**
 * Main execution
 */
function main(): void {
  auditLogger.info('Starting CSP audit...');
  auditLogger.info('');

  // Scan backend
  const backendPath = join(__dirname, '../src');
  auditLogger.info(`Scanning backend: ${backendPath}`);
  scanDirectory(backendPath, ['ts', 'js', 'html', 'ejs', 'pug', 'hbs']);

  // Scan frontend
  const frontendPath = join(__dirname, '../../verbfy-app/src');
  auditLogger.info(`Scanning frontend: ${frontendPath}`);
  scanDirectory(frontendPath, ['ts', 'tsx', 'js', 'jsx', 'html']);

  auditLogger.info('');
  generateReport();
}

main();
