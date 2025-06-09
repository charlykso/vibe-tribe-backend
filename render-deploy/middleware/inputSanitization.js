import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';
import { ValidationError } from './errorHandler.js';
// Configuration for different sanitization levels
export const SanitizationLevel = {
    STRICT: 'strict',
    MODERATE: 'moderate',
    BASIC: 'basic'
};
// Default sanitization configurations
const SANITIZATION_CONFIGS = {
    [SanitizationLevel.STRICT]: {
        allowedTags: [],
        allowedAttributes: [],
        maxLength: 1000,
        trimWhitespace: true
    },
    [SanitizationLevel.MODERATE]: {
        allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
        allowedAttributes: [],
        maxLength: 5000,
        trimWhitespace: true
    },
    [SanitizationLevel.BASIC]: {
        allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
        allowedAttributes: ['href', 'target'],
        maxLength: 10000,
        trimWhitespace: true
    }
};
/**
 * Sanitizes a string value based on the specified options
 */
export function sanitizeString(value, options = { level: SanitizationLevel.STRICT }) {
    if (typeof value !== 'string') {
        throw new ValidationError('Value must be a string');
    }
    const config = SANITIZATION_CONFIGS[options.level];
    // Trim whitespace if enabled
    let sanitized = options.trimWhitespace !== false ? value.trim() : value;
    // Check length limits
    if (options.maxLength && sanitized.length > options.maxLength) {
        throw new ValidationError(`Input exceeds maximum length of ${options.maxLength} characters`);
    }
    // Sanitize HTML content
    sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: options.allowedTags || config.allowedTags,
        ALLOWED_ATTR: options.allowedAttributes || config.allowedAttributes,
        KEEP_CONTENT: true,
        ALLOW_DATA_ATTR: false
    });
    return sanitized;
}
/**
 * Validates and sanitizes email addresses
 */
export function sanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
        throw new ValidationError('Email is required and must be a string');
    }
    const trimmed = email.trim().toLowerCase();
    if (trimmed.length > 254) { // RFC 5321 limit - check this first
        throw new ValidationError('Email address is too long');
    }
    if (!validator.isEmail(trimmed)) {
        throw new ValidationError('Invalid email format');
    }
    return trimmed;
}
/**
 * Validates and sanitizes URLs
 */
export function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') {
        throw new ValidationError('URL is required and must be a string');
    }
    const trimmed = url.trim();
    if (!validator.isURL(trimmed, {
        protocols: ['http', 'https'],
        require_protocol: true,
        require_valid_protocol: true,
        allow_underscores: false
    })) {
        throw new ValidationError('Invalid URL format');
    }
    return trimmed;
}
/**
 * Sanitizes object recursively
 */
export function sanitizeObject(obj, options = { level: SanitizationLevel.STRICT }) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj === 'string') {
        return sanitizeString(obj, options);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, options));
    }
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            // Sanitize the key as well
            const sanitizedKey = sanitizeString(key, { level: SanitizationLevel.STRICT, maxLength: 100 });
            sanitized[sanitizedKey] = sanitizeObject(value, options);
        }
        return sanitized;
    }
    return obj;
}
/**
 * Middleware factory for input sanitization
 */
export function inputSanitizer(options = { level: SanitizationLevel.MODERATE }) {
    return (req, res, next) => {
        try {
            // Sanitize request body
            if (req.body && typeof req.body === 'object') {
                req.body = sanitizeObject(req.body, options);
            }
            // Sanitize query parameters
            if (req.query && typeof req.query === 'object') {
                req.query = sanitizeObject(req.query, {
                    ...options,
                    level: SanitizationLevel.STRICT // Query params should be more strictly sanitized
                });
            }
            // Sanitize URL parameters
            if (req.params && typeof req.params === 'object') {
                req.params = sanitizeObject(req.params, {
                    ...options,
                    level: SanitizationLevel.STRICT
                });
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Specific sanitizers for common use cases
 */
export const sanitizers = {
    // For user-generated content (posts, comments)
    userContent: inputSanitizer({
        level: SanitizationLevel.MODERATE,
        maxLength: 5000
    }),
    // For user profile data
    userProfile: inputSanitizer({
        level: SanitizationLevel.BASIC,
        maxLength: 1000
    }),
    // For search queries and filters
    searchQuery: inputSanitizer({
        level: SanitizationLevel.STRICT,
        maxLength: 200
    }),
    // For administrative content
    adminContent: inputSanitizer({
        level: SanitizationLevel.BASIC,
        maxLength: 10000
    }),
    // For API keys and sensitive data
    sensitiveData: inputSanitizer({
        level: SanitizationLevel.STRICT,
        maxLength: 500
    })
};
/**
 * Validation schemas for common data types
 */
export const validators = {
    email: (email) => sanitizeEmail(email),
    url: (url) => sanitizeUrl(url),
    // Username validation
    username: (username) => {
        const sanitized = sanitizeString(username, { level: SanitizationLevel.STRICT, maxLength: 50 });
        if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
            throw new ValidationError('Username can only contain letters, numbers, underscores, and hyphens');
        }
        if (sanitized.length < 3) {
            throw new ValidationError('Username must be at least 3 characters long');
        }
        return sanitized;
    },
    // Password validation (for registration)
    password: (password) => {
        if (!password || typeof password !== 'string') {
            throw new ValidationError('Password is required');
        }
        if (password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters long');
        }
        if (password.length > 128) {
            throw new ValidationError('Password is too long');
        }
        // Don't sanitize passwords, just validate
        return password;
    },
    // Organization name validation
    organizationName: (name) => {
        const sanitized = sanitizeString(name, { level: SanitizationLevel.STRICT, maxLength: 100 });
        if (sanitized.length < 2) {
            throw new ValidationError('Organization name must be at least 2 characters long');
        }
        return sanitized;
    }
};
//# sourceMappingURL=inputSanitization.js.map