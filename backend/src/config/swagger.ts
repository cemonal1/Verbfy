import swaggerJsdoc from 'swagger-jsdoc';
import { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { createLogger } from '../utils/logger';
import { readFileSync } from 'fs';
import { join } from 'path';

const swaggerLogger = createLogger('SwaggerConfig');

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));
const API_VERSION = packageJson.version || '1.0.0';

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
      version: API_VERSION,
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
        url: 'http://localhost:5000/api/v1',
        description: 'Development server (v1)'
      },
      {
        url: 'https://api.verbfy.com/api/v1',
        description: 'Production server (v1)'
      },
      {
        url: 'http://localhost:5000/api',
        description: 'Development server (deprecated - use /api/v1)',
        variables: {
          deprecated: {
            default: 'true',
            description: 'This endpoint is deprecated. Use /api/v1 instead.'
          }
        }
      },
      {
        url: 'https://api.verbfy.com/api',
        description: 'Production server (deprecated - use /api/v1)',
        variables: {
          deprecated: {
            default: 'true',
            description: 'This endpoint is deprecated. Use /api/v1 instead.'
          }
        }
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
            emailVerified: {
              type: 'boolean',
              example: true
            },
            isApproved: {
              type: 'boolean',
              example: true
            },
            approvalStatus: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
              example: 'approved'
            },
            profileImage: {
              type: 'string',
              example: 'https://example.com/avatar.jpg'
            },
            bio: {
              type: 'string',
              example: 'Experienced English teacher with 5 years of teaching'
            },
            phone: {
              type: 'string',
              example: '+1234567890'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date'
            },
            nationality: {
              type: 'string',
              example: 'USA'
            },
            nativeLanguage: {
              type: 'string',
              example: 'English'
            },
            specialties: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['Business English', 'IELTS Preparation']
            },
            experience: {
              type: 'number',
              example: 5
            },
            education: {
              type: 'string',
              example: 'Bachelor of Arts in English'
            },
            certifications: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['TEFL', 'CELTA']
            },
            hourlyRate: {
              type: 'number',
              example: 30
            },
            rating: {
              type: 'number',
              example: 4.8
            },
            totalLessons: {
              type: 'number',
              example: 150
            },
            englishLevel: {
              type: 'string',
              enum: ['Beginner', 'Intermediate', 'Advanced'],
              example: 'Intermediate'
            },
            cefrLevel: {
              type: 'string',
              enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
              example: 'B2'
            },
            learningGoals: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['Improve speaking', 'Pass TOEFL']
            },
            subscriptionStatus: {
              type: 'string',
              enum: ['active', 'inactive', 'expired'],
              example: 'active'
            },
            lessonTokens: {
              type: 'number',
              example: 10
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Lesson: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            teacherId: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            studentId: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            type: {
              type: 'string',
              enum: ['conversation', 'grammar', 'reading', 'writing', 'listening', 'speaking'],
              example: 'conversation'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
              example: 'scheduled'
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-15T10:00:00Z'
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-15T11:00:00Z'
            },
            duration: {
              type: 'number',
              example: 1,
              description: 'Duration in hours'
            },
            price: {
              type: 'number',
              example: 30
            },
            rating: {
              type: 'number',
              minimum: 1,
              maximum: 5,
              example: 5
            },
            review: {
              type: 'string',
              example: 'Great lesson! Very helpful teacher.'
            },
            notes: {
              type: 'string',
              example: 'Focus on business vocabulary'
            },
            materials: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['507f1f77bcf86cd799439014']
            },
            roomId: {
              type: 'string',
              example: 'livekit-room-123'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Reservation: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            teacher: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            student: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            actualDate: {
              type: 'string',
              format: 'date',
              example: '2025-01-15'
            },
            startTime: {
              type: 'string',
              example: '10:00'
            },
            endTime: {
              type: 'string',
              example: '11:00'
            },
            status: {
              type: 'string',
              enum: ['pending', 'booked', 'inProgress', 'completed', 'cancelled'],
              example: 'booked'
            },
            notes: {
              type: 'string',
              example: 'Student wants to focus on pronunciation'
            },
            isPaid: {
              type: 'boolean',
              example: true
            },
            lessonType: {
              type: 'string',
              example: 'conversation'
            },
            lessonLevel: {
              type: 'string',
              example: 'intermediate'
            },
            lessonDuration: {
              type: 'number',
              example: 60,
              description: 'Duration in minutes'
            },
            price: {
              type: 'number',
              example: 30
            },
            feedback: {
              type: 'string',
              example: 'Excellent teacher, very patient'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Material: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            title: {
              type: 'string',
              example: 'Business English Vocabulary'
            },
            description: {
              type: 'string',
              example: 'Common business terms and phrases'
            },
            type: {
              type: 'string',
              example: 'pdf'
            },
            url: {
              type: 'string',
              example: 'https://s3.amazonaws.com/materials/business-vocab.pdf'
            },
            createdBy: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Message: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            conversationId: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            senderId: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            content: {
              type: 'string',
              example: 'Hello, how are you?'
            },
            read: {
              type: 'boolean',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            type: {
              type: 'string',
              example: 'lesson_reminder'
            },
            title: {
              type: 'string',
              example: 'Lesson starting soon'
            },
            message: {
              type: 'string',
              example: 'Your lesson with John starts in 15 minutes'
            },
            read: {
              type: 'boolean',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            amount: {
              type: 'number',
              example: 100
            },
            currency: {
              type: 'string',
              example: 'USD'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'refunded'],
              example: 'completed'
            },
            stripePaymentIntentId: {
              type: 'string',
              example: 'pi_1234567890'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Availability: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            teacherId: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            dayOfWeek: {
              type: 'number',
              minimum: 0,
              maximum: 6,
              example: 1,
              description: '0=Sunday, 1=Monday, ..., 6=Saturday'
            },
            startTime: {
              type: 'string',
              example: '09:00'
            },
            endTime: {
              type: 'string',
              example: '17:00'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        CEFRTest: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            level: {
              type: 'string',
              enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
              example: 'B2'
            },
            score: {
              type: 'number',
              example: 85
            },
            completedAt: {
              type: 'string',
              format: 'date-time'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'number',
              example: 100
            },
            page: {
              type: 'number',
              example: 1
            },
            limit: {
              type: 'number',
              example: 10
            },
            pages: {
              type: 'number',
              example: 10
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
 * Get OpenAPI specification
 */
export function getSwaggerSpec() {
  return swaggerSpec;
}

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

  // V1 Swagger UI (primary)
  app.use('/api/v1/docs', swaggerUi.serve);
  app.get('/api/v1/docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // V1 OpenAPI JSON
  app.get('/api/v1/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Legacy endpoints (backward compatibility)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-API-Deprecated', 'true');
    res.setHeader('X-API-Deprecation-Info', 'Use /api/v1/docs.json instead');
    res.send(swaggerSpec);
  });

  if (isDev) {
    process.stdout.write('📚 Swagger UI: http://localhost:5000/api/v1/docs\n');
    process.stdout.write('📄 OpenAPI JSON: http://localhost:5000/api/v1/docs.json\n');
  }
}
