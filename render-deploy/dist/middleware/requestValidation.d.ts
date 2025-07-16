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
    objectId: any;
    email: any;
    password: any;
    username: any;
    url: any;
    pagination: {
        page: any;
        limit: any;
        sort: any;
        sortBy: any;
    };
    dateRange: {
        startDate: any;
        endDate: any;
    };
};
/**
 * Validation schemas for specific endpoints
 */
export declare const validationSchemas: {
    auth: {
        register: {
            body: any;
        };
        login: {
            body: any;
        };
        resetPassword: {
            body: any;
        };
        changePassword: {
            body: any;
        };
    };
    users: {
        updateProfile: {
            body: any;
        };
        getUserById: {
            params: any;
        };
    };
    posts: {
        create: {
            body: any;
        };
        update: {
            params: any;
            body: any;
        };
        list: {
            query: any;
        };
    };
    media: {
        upload: {
            body: any;
        };
    };
    socialAccounts: {
        connect: {
            body: any;
        };
    };
    analytics: {
        getMetrics: {
            query: any;
        };
    };
    communities: {
        create: {
            body: any;
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