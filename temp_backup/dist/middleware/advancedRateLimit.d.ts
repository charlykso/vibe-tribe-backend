import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        organization_id?: string;
    };
}
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: AuthenticatedRequest) => string;
    message?: string;
}
export declare function clearRateLimitStore(): void;
/**
 * Advanced rate limiting middleware factory
 */
export declare function createAdvancedRateLimit(config: RateLimitConfig): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Key generators for different rate limiting strategies
 */
export declare const keyGenerators: {
    byIP: (req: AuthenticatedRequest) => string;
    byUser: (req: AuthenticatedRequest) => string;
    byOrganization: (req: AuthenticatedRequest) => string;
    byUserAndEndpoint: (req: AuthenticatedRequest) => string;
    byAPIKey: (req: AuthenticatedRequest) => string;
};
/**
 * Predefined rate limiting configurations
 */
export declare const rateLimitConfigs: {
    general: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    auth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    passwordReset: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    postCreation: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    mediaUpload: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    search: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    organizationAPI: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    admin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
};
/**
 * Dynamic rate limiting based on user role and plan
 */
export declare function createDynamicRateLimit(baseConfig: RateLimitConfig): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Rate limiting middleware that applies different limits based on endpoint
 */
export declare function smartRateLimit(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Get rate limit status for a key
 */
export declare function getRateLimitStatus(key: string): {
    count: number;
    remaining: number;
    resetTime: number;
    isLimited: boolean;
} | null;
export {};
//# sourceMappingURL=advancedRateLimit.d.ts.map