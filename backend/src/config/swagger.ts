import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { createLogger } from '../utils/logger';
const swaggerLogger = createLogger('SwaggerConfig');

/**
 * OpenAPI 3.0 Specification for Verbfy API
 *
 * This configuration generates interactive API documentation using Swagger/OpenAPI 3.0.
 * Documentation is automatically generated from JSDoc comments in route files.
 */
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Verbfy API',
      version: '1.0.0',
      description: 'RESTful API for Verbfy language learning platform - Live video lessons, AI-powered tutoring, and real-time conversations',
      contact: {
        name: 'Verbfy API Support',
        email: 'support@verbfy.com',
        url: 'https://verbfy.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://verbfy.com/terms'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.verbfy.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User profile and account management'
      },
      {
        name: 'Lessons',
        description: 'Live video lesson scheduling and management'
      },
      {
        name: 'Reservations',
        description: 'Lesson booking and reservation system'
      },
      {
        name: 'Availability',
        description: 'Teacher availability management'
      },
      {
        name: 'Materials',
        description: 'Learning materials and resources'
      },
      {
        name: 'Chat',
        description: 'Real-time messaging system'
      },
      {
        name: 'Notifications',
        description: 'User notifications and alerts'
      },
      {
        name: 'Payments',
        description: 'Payment processing and transactions (Stripe)'
      },
      {
        name: 'Analytics',
        description: 'User analytics and reporting'
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints (admin role required)'
      },
      {
        name: 'LiveKit',
        description: 'Video/audio room management (LiveKit integration)'
      },
      {
        name: 'VerbfyTalk',
        description: 'P2P voice chat rooms'
      },
      {
        name: 'Curriculum',
        description: 'Personalized learning curriculum'
      },
      {
        name: 'CEFR Tests',
        description: 'Language proficiency assessment (CEFR)'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login endpoint'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message describing what went wrong'
            },
            error: {
              type: 'string',
              example: 'Technical error details'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            role: {
              type: 'string',
              enum: ['student', 'teacher', 'admin'],
              example: 'student'
            },
            isEmailVerified: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Lesson: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            title: {
              type: 'string',
              example: 'English Conversation Practice'
            },
            description: {
              type: 'string'
            },
            teacherId: {
              type: 'string'
            },
            studentId: {
              type: 'string'
            },
            startTime: {
              type: 'string',
              format: 'date-time'
            },
            endTime: {
              type: 'string',
              format: 'date-time'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'active', 'completed', 'cancelled'],
              example: 'scheduled'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required - Invalid or missing JWT token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Unauthorized - Please login to access this resource'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Access denied - Admin role required'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error - Invalid request data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation failed',
                errors: [
                  { field: 'email', message: 'Valid email required' }
                ]
              }
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts'
  ]
};

// Generate Swagger specification
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Setup Swagger UI middleware
 *
 * @param app - Express application instance
 */
export function setupSwagger(app: Express): void {
  const isDev = process.env.NODE_ENV !== 'production';

  // Swagger UI options
  const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Verbfy API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      syntaxHighlight: {
        theme: 'monokai'
      }
    }
  };

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Serve OpenAPI JSON specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  if (isDev) {
    process.stdout.write('📚 Swagger UI available at http://localhost:5000/api-docs
');
    process.stdout.write('📄 OpenAPI spec available at http://localhost:5000/api-docs.json
');
  }
}
