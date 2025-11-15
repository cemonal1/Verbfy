import request from 'supertest';
import express from 'express';
import { setupSwagger, getSwaggerSpec } from '../config/swagger';

describe('OpenAPI/Swagger Documentation', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    setupSwagger(app);
  });

  describe('GET /api/v1/docs.json', () => {
    it('should return 200 and valid OpenAPI spec', async () => {
      const response = await request(app)
        .get('/api/v1/docs.json')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.openapi).toBe('3.0.0');
      expect(response.body.info).toBeDefined();
      expect(response.body.info.title).toBe('Verbfy API');
      expect(response.body.info.version).toBeDefined();
    });

    it('should contain authentication endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/docs.json')
        .expect(200);

      expect(response.body.paths).toBeDefined();
      // Check for at least one auth endpoint
      const paths = Object.keys(response.body.paths);
      const hasAuthEndpoint = paths.some(path => path.includes('/auth/'));
      expect(hasAuthEndpoint).toBe(true);
    });

    it('should contain security schemes', async () => {
      const response = await request(app)
        .get('/api/v1/docs.json')
        .expect(200);

      expect(response.body.components).toBeDefined();
      expect(response.body.components.securitySchemes).toBeDefined();
      expect(response.body.components.securitySchemes.BearerAuth).toBeDefined();
      expect(response.body.components.securitySchemes.BearerAuth.type).toBe('http');
      expect(response.body.components.securitySchemes.BearerAuth.scheme).toBe('bearer');
    });

    it('should contain shared schemas', async () => {
      const response = await request(app)
        .get('/api/v1/docs.json')
        .expect(200);

      expect(response.body.components.schemas).toBeDefined();
      expect(response.body.components.schemas.User).toBeDefined();
      expect(response.body.components.schemas.Lesson).toBeDefined();
      expect(response.body.components.schemas.Reservation).toBeDefined();
      expect(response.body.components.schemas.Error).toBeDefined();
      expect(response.body.components.schemas.Success).toBeDefined();
    });

    it('should contain v1 servers', async () => {
      const response = await request(app)
        .get('/api/v1/docs.json')
        .expect(200);

      expect(response.body.servers).toBeDefined();
      expect(Array.isArray(response.body.servers)).toBe(true);

      const v1Servers = response.body.servers.filter((server: any) =>
        server.url.includes('/api/v1')
      );
      expect(v1Servers.length).toBeGreaterThan(0);
    });

    it('should contain tags for endpoint organization', async () => {
      const response = await request(app)
        .get('/api/v1/docs.json')
        .expect(200);

      expect(response.body.tags).toBeDefined();
      expect(Array.isArray(response.body.tags)).toBe(true);
      expect(response.body.tags.length).toBeGreaterThan(0);

      const tagNames = response.body.tags.map((tag: any) => tag.name);
      expect(tagNames).toContain('Authentication');
      expect(tagNames).toContain('Users');
      expect(tagNames).toContain('Lessons');
    });
  });

  describe('GET /api-docs.json (legacy)', () => {
    it('should return 200 with deprecation headers', async () => {
      const response = await request(app)
        .get('/api-docs.json')
        .expect('Content-Type', /json/)
        .expect('X-API-Deprecated', 'true')
        .expect('X-API-Deprecation-Info', 'Use /api/v1/docs.json instead')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.openapi).toBe('3.0.0');
    });
  });

  describe('getSwaggerSpec()', () => {
    it('should return valid OpenAPI spec object', () => {
      const spec = getSwaggerSpec();

      expect(spec).toBeDefined();
      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBe('Verbfy API');
      expect(spec.paths).toBeDefined();
      expect(spec.components).toBeDefined();
    });

    it('should have consistent version from package.json', () => {
      const spec = getSwaggerSpec();
      const packageJson = require('../../package.json');

      expect(spec.info.version).toBe(packageJson.version);
    });
  });

  describe('Swagger UI endpoints', () => {
    it('GET /api/v1/docs should return HTML', async () => {
      const response = await request(app)
        .get('/api/v1/docs')
        .expect(200);

      expect(response.text).toContain('Swagger UI');
    });

    it('GET /api-docs (legacy) should return HTML', async () => {
      const response = await request(app)
        .get('/api-docs')
        .expect(200);

      expect(response.text).toContain('Swagger UI');
    });
  });

  describe('Schema validation', () => {
    it('User schema should have required fields', async () => {
      const response = await request(app)
        .get('/api/v1/docs.json')
        .expect(200);

      const userSchema = response.body.components.schemas.User;
      expect(userSchema.type).toBe('object');
      expect(userSchema.properties._id).toBeDefined();
      expect(userSchema.properties.name).toBeDefined();
      expect(userSchema.properties.email).toBeDefined();
      expect(userSchema.properties.role).toBeDefined();
      expect(userSchema.properties.role.enum).toEqual(['student', 'teacher', 'admin']);
    });

    it('Lesson schema should have required fields', async () => {
      const response = await request(app)
        .get('/api/v1/docs.json')
        .expect(200);

      const lessonSchema = response.body.components.schemas.Lesson;
      expect(lessonSchema.type).toBe('object');
      expect(lessonSchema.properties._id).toBeDefined();
      expect(lessonSchema.properties.teacherId).toBeDefined();
      expect(lessonSchema.properties.studentId).toBeDefined();
      expect(lessonSchema.properties.type).toBeDefined();
      expect(lessonSchema.properties.status).toBeDefined();
      expect(lessonSchema.properties.startTime).toBeDefined();
      expect(lessonSchema.properties.endTime).toBeDefined();
    });

    it('Error schema should match standard response format', async () => {
      const response = await request(app)
        .get('/api/v1/docs.json')
        .expect(200);

      const errorSchema = response.body.components.schemas.Error;
      expect(errorSchema.properties.success).toBeDefined();
      expect(errorSchema.properties.message).toBeDefined();
      expect(errorSchema.properties.error).toBeDefined();
    });
  });

  describe('Response definitions', () => {
    it('should have standard error responses', async () => {
      const response = await request(app)
        .get('/api/v1/docs.json')
        .expect(200);

      const responses = response.body.components.responses;
      expect(responses.UnauthorizedError).toBeDefined();
      expect(responses.ForbiddenError).toBeDefined();
      expect(responses.NotFoundError).toBeDefined();
      expect(responses.ValidationError).toBeDefined();
    });

    it('UnauthorizedError should have correct description', async () => {
      const response = await request(app)
        .get('/api/v1/docs.json')
        .expect(200);

      const unauthorizedError = response.body.components.responses.UnauthorizedError;
      expect(unauthorizedError.description).toContain('Authentication');
      expect(unauthorizedError.content).toBeDefined();
      expect(unauthorizedError.content['application/json']).toBeDefined();
    });
  });
});
