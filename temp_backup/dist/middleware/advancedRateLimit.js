// In-memory store for rate limiting
// In production, use Redis or another distributed cache
const rateLimitStore = {};
/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries() {
    const now = Date.now();
    Object.keys(rateLimitStore).forEach(key => {
        if (rateLimitStore[key].resetTime <= now) {
            delete rateLimitStore[key];
        }
    });
}
// Clean up expired entries every 5 minutes (only in production)
let cleanupInterval = null;
if (process.env.NODE_ENV !== 'test') {
    cleanupInterval = setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
// Export cleanup function for testing
export function clearRateLimitStore() {
    Object.keys(rateLimitStore).forEach(key => delete rateLimitStore[key]);
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
    }
}
/**
 * Advanced rate limiting middleware factory
 */
export function createAdvancedRateLimit(config) {
    const { windowMs, maxRequests, skipSuccessfulRequests = false, skipFailedRequests = false, keyGenerator, message = 'Too many requests, please try again later.' } = config;
    return (req, res, next) => {
        try {
            // Generate rate limit key
            const key = keyGenerator ? keyGenerator(req) : req.ip;
            const now = Date.now();
            // Get or create rate limit entry
            if (!rateLimitStore[key] || rateLimitStore[key].resetTime <= now) {
                rateLimitStore[key] = {
                    count: 0,
                    resetTime: now + windowMs
                };
            }
            const entry = rateLimitStore[key];
            // Check if limit exceeded
            if (entry.count >= maxRequests) {
                const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);
                res.set({
                    'X-RateLimit-Limit': maxRequests.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': entry.resetTime.toString(),
                    'Retry-After': resetTimeSeconds.toString()
                });
                res.status(429).json({
                    error: message,
                    code: 'RATE_LIMIT_EXCEEDED'
                });
                return;
            }
            // Increment counter
            entry.count++;
            // Set rate limit headers
            res.set({
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': (maxRequests - entry.count).toString(),
                'X-RateLimit-Reset': entry.resetTime.toString()
            });
            // Handle response to potentially skip counting
            const originalSend = res.send;
            res.send = function (body) {
                const statusCode = res.statusCode;
                // Decrement counter if we should skip this request
                if ((skipSuccessfulRequests && statusCode < 400) ||
                    (skipFailedRequests && statusCode >= 400)) {
                    entry.count--;
                }
                return originalSend.call(this, body);
            };
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Key generators for different rate limiting strategies
 */
export const keyGenerators = {
    // Rate limit by IP address
    byIP: (req) => `ip:${req.ip}`,
    // Rate limit by user ID
    byUser: (req) => req.user ? `user:${req.user.id}` : `ip:${req.ip}`,
    // Rate limit by organization
    byOrganization: (req) => req.user?.organization_id ? `org:${req.user.organization_id}` : `ip:${req.ip}`,
    // Rate limit by user and endpoint
    byUserAndEndpoint: (req) => req.user ? `user:${req.user.id}:${req.route?.path || req.path}` : `ip:${req.ip}`,
    // Rate limit by API key (if using API keys)
    byAPIKey: (req) => {
        const apiKey = req.headers['x-api-key'];
        return apiKey ? `api:${apiKey}` : `ip:${req.ip}`;
    }
};
/**
 * Predefined rate limiting configurations
 */
export const rateLimitConfigs = {
    // General API rate limiting
    general: createAdvancedRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000,
        keyGenerator: keyGenerators.byUser,
        message: 'Too many API requests, please try again later.'
    }),
    // Authentication endpoints (stricter)
    auth: createAdvancedRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 10,
        keyGenerator: keyGenerators.byIP,
        message: 'Too many authentication attempts, please try again later.'
    }),
    // Password reset (very strict)
    passwordReset: createAdvancedRateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
        keyGenerator: keyGenerators.byIP,
        message: 'Too many password reset attempts, please try again later.'
    }),
    // Post creation
    postCreation: createAdvancedRateLimit({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        keyGenerator: keyGenerators.byUser,
        message: 'Too many posts created, please slow down.'
    }),
    // Media upload
    mediaUpload: createAdvancedRateLimit({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 20,
        keyGenerator: keyGenerators.byUser,
        message: 'Too many file uploads, please wait before uploading more.'
    }),
    // Search queries
    search: createAdvancedRateLimit({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
        keyGenerator: keyGenerators.byUser,
        message: 'Too many search requests, please slow down.'
    }),
    // Organization-level limits for enterprise features
    organizationAPI: createAdvancedRateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 10000,
        keyGenerator: keyGenerators.byOrganization,
        message: 'Organization API limit exceeded, please contact support.'
    }),
    // Admin operations (very permissive for admins)
    admin: createAdvancedRateLimit({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 1000,
        keyGenerator: keyGenerators.byUser,
        message: 'Admin rate limit exceeded.'
    })
};
/**
 * Dynamic rate limiting based on user role and plan
 */
export function createDynamicRateLimit(baseConfig) {
    return (req, res, next) => {
        let config = { ...baseConfig };
        // Adjust limits based on user role
        if (req.user) {
            switch (req.user.role) {
                case 'admin':
                    config.maxRequests *= 10; // Admins get 10x the limit
                    break;
                case 'premium':
                    config.maxRequests *= 5; // Premium users get 5x the limit
                    break;
                case 'pro':
                    config.maxRequests *= 3; // Pro users get 3x the limit
                    break;
                default:
                    // Standard users keep the base limit
                    break;
            }
        }
        // Apply the dynamic rate limit
        createAdvancedRateLimit(config)(req, res, next);
    };
}
/**
 * Rate limiting middleware that applies different limits based on endpoint
 */
export function smartRateLimit() {
    return (req, res, next) => {
        const path = req.path;
        const method = req.method;
        // Choose appropriate rate limit based on endpoint
        if (path.includes('/auth/') && (method === 'POST')) {
            return rateLimitConfigs.auth(req, res, next);
        }
        if (path.includes('/password-reset')) {
            return rateLimitConfigs.passwordReset(req, res, next);
        }
        if (path.includes('/posts') && method === 'POST') {
            return rateLimitConfigs.postCreation(req, res, next);
        }
        if (path.includes('/media') && method === 'POST') {
            return rateLimitConfigs.mediaUpload(req, res, next);
        }
        if (path.includes('/search')) {
            return rateLimitConfigs.search(req, res, next);
        }
        if (req.user?.role === 'admin') {
            return rateLimitConfigs.admin(req, res, next);
        }
        // Default general rate limiting
        return rateLimitConfigs.general(req, res, next);
    };
}
/**
 * Get rate limit status for a key
 */
export function getRateLimitStatus(key) {
    const entry = rateLimitStore[key];
    if (!entry) {
        return null;
    }
    const now = Date.now();
    if (entry.resetTime <= now) {
        delete rateLimitStore[key];
        return null;
    }
    return {
        count: entry.count,
        remaining: Math.max(0, 100 - entry.count), // Assuming default limit of 100
        resetTime: entry.resetTime,
        isLimited: entry.count >= 100
    };
}
//# sourceMappingURL=advancedRateLimit.js.map