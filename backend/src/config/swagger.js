const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VMS API Documentation',
      version: '1.0.0',
      description: 'Visitor Management System API - Complete Documentation with Role-Based Access Control (SuperAdmin & Estate Manager)',
      contact: {
        name: 'Code Club Academy',
        email: 'support@codeclub.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'https://vmsbackend.vercel.app/api/v1',
        description: 'Production server (Vercel)',
      },
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'ERROR_CODE',
                },
                message: {
                  type: 'string',
                  example: 'Error message',
                },
                details: {
                  type: 'object',
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            phone: {
              type: 'string',
              example: '+1234567890',
            },
            profilePicture: {
              type: 'string',
              example: 'https://example.com/avatar.jpg',
            },
            role: {
              type: 'string',
              enum: ['superadmin', 'estate_manager', 'security', 'resident'],
              example: 'resident',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              example: 'active',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Estate: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Green Valley Estate',
            },
            address: {
              type: 'string',
              example: '123 Main Street, Accra, Ghana',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Home: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            estateId: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Residence 1',
            },
            plotNumber: {
              type: 'string',
              example: 'A1',
            },
            street: {
              type: 'string',
              example: 'Palm Avenue',
            },
            contactEmail: {
              type: 'string',
              format: 'email',
              example: 'contact1@example.com',
            },
            contactPhone: {
              type: 'string',
              example: '+233244120001',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Invitation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'newuser@example.com',
            },
            token: {
              type: 'string',
              example: 'abc123def456...',
            },
            role: {
              type: 'string',
              enum: ['superadmin', 'estate_manager', 'security', 'resident'],
              example: 'resident',
            },
            estateId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            homeId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'expired', 'cancelled'],
              example: 'pending',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
            },
            invitedBy: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            acceptedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AccessCode: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            residentId: {
              type: 'string',
              format: 'uuid',
            },
            code: {
              type: 'string',
              example: 'ABC12',
            },
            qrCode: {
              type: 'string',
              example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
            },
            visitDate: {
              type: 'string',
              format: 'date',
              example: '2025-10-09',
            },
            startTime: {
              type: 'string',
              format: 'time',
              example: '09:00',
            },
            endTime: {
              type: 'string',
              format: 'time',
              example: '17:00',
            },
            visitorName: {
              type: 'string',
              example: 'Jane Visitor',
            },
            status: {
              type: 'string',
              enum: ['active', 'expired', 'used'],
              example: 'active',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Security: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            estateId: {
              type: 'string',
              format: 'uuid',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Guard',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'security@example.com',
            },
            phone: {
              type: 'string',
              example: '+1234567890',
            },
            profilePicture: {
              type: 'string',
              example: 'https://example.com/avatar.jpg',
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            lastPasswordChange: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        EntryLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            residentId: {
              type: 'string',
              format: 'uuid',
            },
            securityId: {
              type: 'string',
              format: 'uuid',
            },
            accessCodeId: {
              type: 'string',
              format: 'uuid',
            },
            code: {
              type: 'string',
              example: 'ABC12',
            },
            result: {
              type: 'string',
              enum: ['granted', 'denied'],
              example: 'granted',
            },
            reason: {
              type: 'string',
              example: 'Valid code',
            },
            gate: {
              type: 'string',
              example: 'Main Gate',
            },
            validatedAt: {
              type: 'string',
              format: 'date-time',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              example: 'Password123!',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                user: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
        SendInvitationRequest: {
          type: 'object',
          required: ['email', 'role'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'newuser@example.com',
            },
            role: {
              type: 'string',
              enum: ['superadmin', 'estate_manager', 'security', 'resident'],
              example: 'resident',
            },
            estate_id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            home_id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440001',
            },
          },
        },
        AcceptInvitationRequest: {
          type: 'object',
          required: ['token', 'firstName', 'lastName', 'password'],
          properties: {
            token: {
              type: 'string',
              example: 'abc123def456...',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            phone: {
              type: 'string',
              example: '+1234567890',
            },
            profilePicture: {
              type: 'string',
              example: 'https://example.com/avatar.jpg',
            },
            password: {
              type: 'string',
              example: 'MySecurePassword123!',
            },
          },
        },
        CreateSuperAdminRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            firstName: {
              type: 'string',
              example: 'Super',
            },
            lastName: {
              type: 'string',
              example: 'Admin',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'superadmin@vms.com',
            },
            phone: {
              type: 'string',
              example: '+1234567890',
            },
            password: {
              type: 'string',
              example: 'SecurePassword123!',
            },
          },
        },
        DashboardStats: {
          type: 'object',
          properties: {
            total_homes: {
              type: 'integer',
              example: 10,
            },
            total_residents: {
              type: 'integer',
              example: 20,
            },
            active_codes_today: {
              type: 'integer',
              example: 5,
            },
            entries_today: {
              type: 'integer',
              example: 12,
            },
            entries_granted_today: {
              type: 'integer',
              example: 10,
            },
            entries_denied_today: {
              type: 'integer',
              example: 2,
            },
            recent_activity: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['entry_granted', 'entry_denied'],
                  },
                  visitor: {
                    type: 'string',
                  },
                  resident: {
                    type: 'string',
                  },
                  time: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'Authentication endpoints for all user types' },
      { name: 'Resident', description: 'Resident code management and access' },
      { name: 'Security', description: 'Security validation and gate management' },
      { name: 'Admin', description: 'Admin management and estate operations' },
      { name: 'Invitations', description: 'User invitation system (Public endpoints)' },
      { name: 'System', description: 'System initialization and status' },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

