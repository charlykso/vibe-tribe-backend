import { Request, Response, NextFunction } from 'express';
export declare const SanitizationLevel: {
    readonly STRICT: "strict";
    readonly MODERATE: "moderate";
    readonly BASIC: "basic";
};
type SanitizationLevelType = typeof SanitizationLevel[keyof typeof SanitizationLevel];
interface SanitizationOptions {
    level: SanitizationLevelType;
    allowedTags?: string[];
    allowedAttributes?: string[];
    maxLength?: number;
    trimWhitespace?: boolean;
}
/**
 * Sanitizes a string value based on the specified options
 */
export declare function sanitizeString(value: string, options?: SanitizationOptions): string;
/**
 * Validates and sanitizes email addresses
 */
export declare function sanitizeEmail(email: string): string;
/**
 * Validates and sanitizes URLs
 */
export declare function sanitizeUrl(url: string): string;
/**
 * Sanitizes object recursively
 */
export declare function sanitizeObject(obj: any, options?: SanitizationOptions): any;
/**
 * Middleware factory for input sanitization
 */
export declare function inputSanitizer(options?: SanitizationOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Specific sanitizers for common use cases
 */
export declare const sanitizers: {
    userContent: (req: Request, res: Response, next: NextFunction) => void;
    userProfile: (req: Request, res: Response, next: NextFunction) => void;
    searchQuery: (req: Request, res: Response, next: NextFunction) => void;
    adminContent: (req: Request, res: Response, next: NextFunction) => void;
    sensitiveData: (req: Request, res: Response, next: NextFunction) => void;
};
/**
 * Validation schemas for common data types
 */
export declare const validators: {
    email: (email: string) => string;
    url: (url: string) => string;
    username: (username: string) => string;
    password: (password: string) => string;
    organizationName: (name: string) => string;
};
export {};
//# sourceMappingURL=inputSanitization.d.ts.map