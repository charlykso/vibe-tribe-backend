import { Request, Response, NextFunction } from 'express';
interface CSRFRequest extends Request {
    csrfToken?: string;
    session?: {
        csrfSecret?: string;
    };
}
/**
 * CSRF token generation middleware
 * Adds a CSRF token to the request object and response headers
 */
export declare function csrfTokenGenerator(): (req: CSRFRequest, res: Response, next: NextFunction) => void;
/**
 * CSRF protection middleware
 * Validates CSRF tokens for state-changing operations
 */
export declare function csrfProtection(options?: {
    ignoreMethods?: string[];
    headerName?: string;
    bodyField?: string;
}): (req: CSRFRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware to provide CSRF token in response
 * Useful for SPA applications that need to get the token
 */
export declare function csrfTokenProvider(): (req: CSRFRequest, res: Response, next: NextFunction) => void;
/**
 * Route handler to get CSRF token
 * GET /api/v1/csrf-token
 */
export declare function getCsrfToken(req: CSRFRequest, res: Response): void;
/**
 * Enhanced CSRF protection for high-security operations
 * Requires both CSRF token and additional verification
 */
export declare function enhancedCSRFProtection(options?: {
    requireDoubleSubmit?: boolean;
    maxAge?: number;
}): (req: CSRFRequest, res: Response, next: NextFunction) => void;
/**
 * CSRF configuration for different route types
 */
export declare const csrfConfigs: {
    standard: (req: CSRFRequest, res: Response, next: NextFunction) => void;
    enhanced: (req: CSRFRequest, res: Response, next: NextFunction) => void;
    api: (req: CSRFRequest, res: Response, next: NextFunction) => void;
};
export {};
//# sourceMappingURL=csrfProtection.d.ts.map