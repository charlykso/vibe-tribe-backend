import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
interface ValidationSchema {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
    headers?: Joi.ObjectSchema;
}
/**
 * Request validation middleware factory
 */
export declare function validateRequest(schema: ValidationSchema): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Common validation schemas
 */
export declare const commonSchemas: {
    objectId: Joi.StringSchema<string>;
    email: Joi.StringSchema<string>;
    password: Joi.StringSchema<string>;
    username: Joi.StringSchema<string>;
    url: Joi.StringSchema<string>;
    pagination: {
        page: Joi.NumberSchema<number>;
        limit: Joi.NumberSchema<number>;
        sort: Joi.StringSchema<string>;
        sortBy: Joi.StringSchema<string>;
    };
    dateRange: {
        startDate: Joi.DateSchema<Date>;
        endDate: Joi.DateSchema<Date>;
    };
};
/**
 * Validation schemas for specific endpoints
 */
export declare const validationSchemas: {
    auth: {
        register: {
            body: Joi.ObjectSchema<any>;
        };
        login: {
            body: Joi.ObjectSchema<any>;
        };
        resetPassword: {
            body: Joi.ObjectSchema<any>;
        };
        changePassword: {
            body: Joi.ObjectSchema<any>;
        };
    };
    users: {
        updateProfile: {
            body: Joi.ObjectSchema<any>;
        };
        getUserById: {
            params: Joi.ObjectSchema<any>;
        };
    };
    posts: {
        create: {
            body: Joi.ObjectSchema<any>;
        };
        update: {
            params: Joi.ObjectSchema<any>;
            body: Joi.ObjectSchema<any>;
        };
        list: {
            query: Joi.ObjectSchema<any>;
        };
    };
    media: {
        upload: {
            body: Joi.ObjectSchema<any>;
        };
    };
    socialAccounts: {
        connect: {
            body: Joi.ObjectSchema<any>;
        };
    };
    analytics: {
        getMetrics: {
            query: Joi.ObjectSchema<any>;
        };
    };
    communities: {
        create: {
            body: Joi.ObjectSchema<any>;
        };
    };
};
/**
 * Middleware for common validation patterns
 */
export declare const validators: {
    pagination: (req: Request, res: Response, next: NextFunction) => void;
    objectIdParam: (paramName?: string) => (req: Request, res: Response, next: NextFunction) => void;
    dateRange: (req: Request, res: Response, next: NextFunction) => void;
    fileUpload: (req: Request, res: Response, next: NextFunction) => void;
};
/**
 * Custom validation functions
 */
export declare const customValidators: {
    ownershipValidation: (resourceField?: string) => (req: any, res: Response, next: NextFunction) => void;
    organizationValidation: () => (req: any, res: Response, next: NextFunction) => void;
    roleValidation: (allowedRoles: string[]) => (req: any, res: Response, next: NextFunction) => void;
};
export {};
//# sourceMappingURL=requestValidation.d.ts.map