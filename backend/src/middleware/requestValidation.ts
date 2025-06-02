import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler.js';

interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}

/**
 * Request validation middleware factory
 */
export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors: string[] = [];

      // Validate request body
      if (schema.body) {
        const { error } = schema.body.validate(req.body, { abortEarly: false });
        if (error) {
          errors.push(...error.details.map(detail => `Body: ${detail.message}`));
        }
      }

      // Validate query parameters
      if (schema.query) {
        const { error } = schema.query.validate(req.query, { abortEarly: false });
        if (error) {
          errors.push(...error.details.map(detail => `Query: ${detail.message}`));
        }
      }

      // Validate URL parameters
      if (schema.params) {
        const { error } = schema.params.validate(req.params, { abortEarly: false });
        if (error) {
          errors.push(...error.details.map(detail => `Params: ${detail.message}`));
        }
      }

      // Validate headers
      if (schema.headers) {
        const { error } = schema.headers.validate(req.headers, { abortEarly: false });
        if (error) {
          errors.push(...error.details.map(detail => `Headers: ${detail.message}`));
        }
      }

      if (errors.length > 0) {
        throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // MongoDB ObjectId validation
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format'),
  
  // Email validation
  email: Joi.string().email().max(254).lowercase().trim(),
  
  // Password validation
  password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  // Username validation
  username: Joi.string().alphanum().min(3).max(30).lowercase().trim(),
  
  // URL validation
  url: Joi.string().uri({ scheme: ['http', 'https'] }).max(2048),
  
  // Pagination
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().max(50)
  },
  
  // Date range
  dateRange: {
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate'))
  }
};

/**
 * Validation schemas for specific endpoints
 */
export const validationSchemas = {
  // Authentication
  auth: {
    register: {
      body: Joi.object({
        email: commonSchemas.email.required(),
        password: commonSchemas.password.required(),
        name: Joi.string().min(2).max(100).trim().required(),
        organizationName: Joi.string().min(2).max(100).trim().optional()
      })
    },
    
    login: {
      body: Joi.object({
        email: commonSchemas.email.required(),
        password: Joi.string().required()
      })
    },
    
    resetPassword: {
      body: Joi.object({
        email: commonSchemas.email.required()
      })
    },
    
    changePassword: {
      body: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: commonSchemas.password.required()
      })
    }
  },

  // User management
  users: {
    updateProfile: {
      body: Joi.object({
        name: Joi.string().min(2).max(100).trim().optional(),
        bio: Joi.string().max(500).trim().optional(),
        website: commonSchemas.url.optional(),
        location: Joi.string().max(100).trim().optional()
      })
    },
    
    getUserById: {
      params: Joi.object({
        id: commonSchemas.objectId.required()
      })
    }
  },

  // Posts
  posts: {
    create: {
      body: Joi.object({
        content: Joi.string().min(1).max(5000).trim().required(),
        platforms: Joi.array().items(
          Joi.string().valid('twitter', 'linkedin', 'instagram', 'facebook')
        ).min(1).required(),
        scheduledFor: Joi.date().iso().greater('now').optional(),
        mediaUrls: Joi.array().items(commonSchemas.url).max(10).optional(),
        tags: Joi.array().items(Joi.string().max(50)).max(20).optional()
      })
    },
    
    update: {
      params: Joi.object({
        id: commonSchemas.objectId.required()
      }),
      body: Joi.object({
        content: Joi.string().min(1).max(5000).trim().optional(),
        scheduledFor: Joi.date().iso().greater('now').optional(),
        tags: Joi.array().items(Joi.string().max(50)).max(20).optional()
      })
    },
    
    list: {
      query: Joi.object({
        ...commonSchemas.pagination,
        status: Joi.string().valid('draft', 'scheduled', 'published', 'failed').optional(),
        platform: Joi.string().valid('twitter', 'linkedin', 'instagram', 'facebook').optional(),
        ...commonSchemas.dateRange
      })
    }
  },

  // Media uploads
  media: {
    upload: {
      body: Joi.object({
        type: Joi.string().valid('image', 'video', 'document').required(),
        purpose: Joi.string().valid('post', 'profile', 'cover').default('post')
      })
    }
  },

  // Social accounts
  socialAccounts: {
    connect: {
      body: Joi.object({
        platform: Joi.string().valid('twitter', 'linkedin', 'instagram', 'facebook').required(),
        accessToken: Joi.string().required(),
        refreshToken: Joi.string().optional(),
        expiresAt: Joi.date().iso().optional()
      })
    }
  },

  // Analytics
  analytics: {
    getMetrics: {
      query: Joi.object({
        ...commonSchemas.dateRange,
        platform: Joi.string().valid('twitter', 'linkedin', 'instagram', 'facebook').optional(),
        metric: Joi.string().valid('engagement', 'reach', 'impressions', 'clicks').optional()
      })
    }
  },

  // Communities (Phase 3)
  communities: {
    create: {
      body: Joi.object({
        name: Joi.string().min(2).max(100).trim().required(),
        description: Joi.string().max(500).trim().optional(),
        platform: Joi.string().valid('discord', 'telegram', 'slack').required(),
        settings: Joi.object({
          isPublic: Joi.boolean().default(true),
          allowInvites: Joi.boolean().default(true),
          moderationLevel: Joi.string().valid('low', 'medium', 'high').default('medium')
        }).optional()
      })
    }
  }
};

/**
 * Middleware for common validation patterns
 */
export const validators = {
  // Validate pagination parameters
  pagination: validateRequest({
    query: Joi.object(commonSchemas.pagination)
  }),
  
  // Validate ObjectId in params
  objectIdParam: (paramName: string = 'id') => validateRequest({
    params: Joi.object({
      [paramName]: commonSchemas.objectId.required()
    })
  }),
  
  // Validate date range in query
  dateRange: validateRequest({
    query: Joi.object(commonSchemas.dateRange)
  }),
  
  // Validate file upload
  fileUpload: validateRequest({
    body: Joi.object({
      filename: Joi.string().max(255).required(),
      mimetype: Joi.string().valid(
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm',
        'application/pdf'
      ).required(),
      size: Joi.number().max(50 * 1024 * 1024) // 50MB max
    })
  })
};

/**
 * Custom validation functions
 */
export const customValidators = {
  // Validate that user owns the resource
  ownershipValidation: (resourceField: string = 'userId') => {
    return (req: any, res: Response, next: NextFunction) => {
      if (req.user && req.body[resourceField] && req.body[resourceField] !== req.user.id) {
        return next(new ValidationError('You can only modify your own resources'));
      }
      next();
    };
  },
  
  // Validate organization membership
  organizationValidation: () => {
    return (req: any, res: Response, next: NextFunction) => {
      if (req.user && req.body.organizationId && req.body.organizationId !== req.user.organization_id) {
        return next(new ValidationError('Invalid organization access'));
      }
      next();
    };
  },
  
  // Validate role permissions
  roleValidation: (allowedRoles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return next(new ValidationError('Insufficient permissions for this operation'));
      }
      next();
    };
  }
};
