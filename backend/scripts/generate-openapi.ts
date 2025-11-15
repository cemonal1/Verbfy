#!/usr/bin/env ts-node
/**
 * OpenAPI Specification Generator
 *
 * Generates openapi.json file from Swagger JSDoc comments
 * Usage: npm run generate:openapi
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { getSwaggerSpec } from '../src/config/swagger';
import { createLogger } from '../src/utils/logger';

const logger = createLogger('OpenAPIGenerator');

async function generateOpenAPISpec(): Promise<void> {
  try {
    logger.info('Generating OpenAPI specification...');

    const swaggerSpec = getSwaggerSpec();
    const outputPath = join(__dirname, '../openapi.json');

    // Write spec to file
    writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), 'utf-8');

    logger.info(`OpenAPI specification generated successfully at: ${outputPath}`);
    logger.info(`API Version: ${swaggerSpec.info.version}`);
    logger.info(`Total paths: ${Object.keys(swaggerSpec.paths || {}).length}`);
    logger.info(`Total schemas: ${Object.keys(swaggerSpec.components?.schemas || {}).length}`);

    process.exit(0);
  } catch (error) {
    logger.error('Failed to generate OpenAPI specification', {
      error: error instanceof Error ? error.message : error
    });
    process.exit(1);
  }
}

generateOpenAPISpec();
