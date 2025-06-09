import helmet from 'helmet';
/**
 * Enhanced security headers configuration
 */
export function enhancedSecurityHeaders() {
    return helmet({
        // Content Security Policy
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'", // Required for some UI libraries
                    "https://fonts.googleapis.com",
                    "https://cdn.jsdelivr.net"
                ],
                scriptSrc: [
                    "'self'",
                    "https://cdn.jsdelivr.net",
                    "https://unpkg.com",
                    // Add nonce support for inline scripts
                    (req, res) => `'nonce-${res.locals.nonce}'`
                ],
                imgSrc: [
                    "'self'",
                    "data:",
                    "https:",
                    "https://res.cloudinary.com", // Cloudinary for media
                    "https://images.unsplash.com" // If using Unsplash
                ],
                fontSrc: [
                    "'self'",
                    "https://fonts.gstatic.com",
                    "data:"
                ],
                connectSrc: [
                    "'self'",
                    "https://api.cloudinary.com",
                    "wss:", // WebSocket connections
                    "ws:" // WebSocket connections (dev)
                ],
                mediaSrc: ["'self'", "https:", "data:"],
                objectSrc: ["'none'"],
                frameSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
            },
            reportOnly: process.env.NODE_ENV === 'development'
        },
        // HTTP Strict Transport Security
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },
        // X-Frame-Options
        frameguard: {
            action: 'deny'
        },
        // X-Content-Type-Options
        noSniff: true,
        // X-XSS-Protection
        xssFilter: true,
        // Referrer Policy
        referrerPolicy: {
            policy: ['strict-origin-when-cross-origin']
        },
        // Note: Permissions Policy is handled separately in custom headers
        // Cross-Origin Embedder Policy
        crossOriginEmbedderPolicy: false, // Set to true if you need cross-origin isolation
        // Cross-Origin Opener Policy
        crossOriginOpenerPolicy: {
            policy: 'same-origin'
        },
        // Cross-Origin Resource Policy
        crossOriginResourcePolicy: {
            policy: 'cross-origin'
        },
        // Hide X-Powered-By header
        hidePoweredBy: true
    });
}
/**
 * Custom security headers middleware
 */
export function customSecurityHeaders() {
    return (req, res, next) => {
        // Generate nonce for CSP
        const nonce = Buffer.from(Math.random().toString()).toString('base64');
        res.locals.nonce = nonce;
        // Custom security headers
        res.setHeader('X-Request-ID', req.headers['x-request-id'] || generateRequestId());
        res.setHeader('X-API-Version', process.env.API_VERSION || '1.0.0');
        res.setHeader('X-Rate-Limit-Policy', 'dynamic');
        // Security headers for API responses
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        // Prevent MIME type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');
        // Prevent clickjacking
        res.setHeader('X-Frame-Options', 'DENY');
        // XSS protection
        res.setHeader('X-XSS-Protection', '1; mode=block');
        // Referrer policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        // Feature policy
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');
        next();
    };
}
/**
 * Security headers for different environments
 */
export function environmentSpecificHeaders() {
    return (req, res, next) => {
        if (process.env.NODE_ENV === 'production') {
            // Production-specific headers
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
            res.setHeader('Expect-CT', 'max-age=86400, enforce');
        }
        else {
            // Development-specific headers
            res.setHeader('X-Development-Mode', 'true');
        }
        next();
    };
}
/**
 * API-specific security headers
 */
export function apiSecurityHeaders() {
    return (req, res, next) => {
        // Headers specific to API endpoints
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        // API versioning
        res.setHeader('X-API-Version', '1.0.0');
        // CORS headers for API
        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
        }
        next();
    };
}
/**
 * Generate a unique request ID
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
/**
 * Security headers for file uploads
 */
export function uploadSecurityHeaders() {
    return (req, res, next) => {
        // Additional headers for file upload endpoints
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
        next();
    };
}
/**
 * Security headers for WebSocket connections
 */
export function websocketSecurityHeaders() {
    return (req, res, next) => {
        // Headers for WebSocket upgrade requests
        if (req.headers.upgrade === 'websocket') {
            res.setHeader('X-WebSocket-Security', 'enabled');
            res.setHeader('X-Frame-Options', 'DENY');
        }
        next();
    };
}
/**
 * Comprehensive security headers middleware
 */
export function comprehensiveSecurityHeaders() {
    return [
        enhancedSecurityHeaders(),
        customSecurityHeaders(),
        environmentSpecificHeaders(),
        apiSecurityHeaders()
    ];
}
/**
 * Security headers configuration for different route types
 */
export const securityHeaderConfigs = {
    // Standard API routes
    api: [
        enhancedSecurityHeaders(),
        customSecurityHeaders(),
        apiSecurityHeaders()
    ],
    // File upload routes
    upload: [
        enhancedSecurityHeaders(),
        customSecurityHeaders(),
        uploadSecurityHeaders()
    ],
    // WebSocket routes
    websocket: [
        enhancedSecurityHeaders(),
        customSecurityHeaders(),
        websocketSecurityHeaders()
    ],
    // Public routes (less restrictive)
    public: [
        helmet({
            contentSecurityPolicy: false, // More permissive for public content
            hsts: process.env.NODE_ENV === 'production'
        }),
        customSecurityHeaders()
    ]
};
//# sourceMappingURL=securityHeaders.js.map