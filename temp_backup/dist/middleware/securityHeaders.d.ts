import { Request, Response, NextFunction } from 'express';
/**
 * Enhanced security headers configuration
 */
export declare function enhancedSecurityHeaders(): (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
/**
 * Custom security headers middleware
 */
export declare function customSecurityHeaders(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Security headers for different environments
 */
export declare function environmentSpecificHeaders(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * API-specific security headers
 */
export declare function apiSecurityHeaders(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Security headers for file uploads
 */
export declare function uploadSecurityHeaders(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Security headers for WebSocket connections
 */
export declare function websocketSecurityHeaders(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Comprehensive security headers middleware
 */
export declare function comprehensiveSecurityHeaders(): ((req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void)[];
/**
 * Security headers configuration for different route types
 */
export declare const securityHeaderConfigs: {
    api: ((req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void)[];
    upload: ((req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void)[];
    websocket: ((req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void)[];
    public: ((req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void)[];
};
//# sourceMappingURL=securityHeaders.d.ts.map