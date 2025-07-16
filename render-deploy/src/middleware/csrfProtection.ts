import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { UnauthorizedError } from './errorHandler.js';

interface CSRFRequest extends Request {
  csrfToken?: string;
  session?: {
    csrfSecret?: string;
  };
}

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate CSRF token based on secret
 */
function generateCSRFToken(secret: string): string {
  const token = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', secret).update(token).digest('hex');
  return `${token}.${hash}`;
}

/**
 * Verify CSRF token against secret
 */
function verifyCSRFToken(token: string, secret: string): boolean {
  try {
    const [tokenPart, hashPart] = token.split('.');
    if (!tokenPart || !hashPart) {
      return false;
    }
    
    const expectedHash = crypto.createHmac('sha256', secret).update(tokenPart).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hashPart, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch (error) {
    return false;
  }
}

/**
 * Get or create CSRF secret for the session
 */
function getOrCreateSecret(req: CSRFRequest): string {
  // In a real application, you'd store this in a session store (Redis, database, etc.)
  // For now, we'll use a simple in-memory approach with JWT payload
  if (!req.session) {
    req.session = {};
  }
  
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = generateToken();
  }
  
  return req.session.csrfSecret;
}

/**
 * CSRF token generation middleware
 * Adds a CSRF token to the request object and response headers
 */
export function csrfTokenGenerator() {
  return (req: CSRFRequest, res: Response, next: NextFunction): void => {
    try {
      const secret = getOrCreateSecret(req);
      const token = generateCSRFToken(secret);
      
      // Add token to request object for use in responses
      req.csrfToken = token;
      
      // Add token to response headers
      res.setHeader('X-CSRF-Token', token);
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * CSRF protection middleware
 * Validates CSRF tokens for state-changing operations
 */
export function csrfProtection(options: {
  ignoreMethods?: string[];
  headerName?: string;
  bodyField?: string;
} = {}) {
  const {
    ignoreMethods = ['GET', 'HEAD', 'OPTIONS'],
    headerName = 'x-csrf-token',
    bodyField = '_csrf'
  } = options;

  return (req: CSRFRequest, res: Response, next: NextFunction): void => {
    try {
      // Skip CSRF protection for safe methods
      if (ignoreMethods.includes(req.method.toUpperCase())) {
        return next();
      }

      // Skip for API endpoints that use JWT authentication only
      // (CSRF is mainly for browser-based requests with cookies)
      const isAPIRequest = req.path.startsWith('/api/') && req.headers.authorization;
      if (isAPIRequest) {
        return next();
      }

      // Get CSRF token from headers or body
      const token = req.headers[headerName] as string || 
                   (req.body && req.body[bodyField]) as string;

      if (!token) {
        res.status(401).json({
          error: 'CSRF token missing',
          code: 'CSRF_TOKEN_MISSING'
        });
        return;
      }

      // Get the secret (this would typically come from session storage)
      const secret = getOrCreateSecret(req);
      
      if (!verifyCSRFToken(token, secret)) {
        res.status(401).json({
          error: 'Invalid CSRF token',
          code: 'CSRF_TOKEN_INVALID'
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to provide CSRF token in response
 * Useful for SPA applications that need to get the token
 */
export function csrfTokenProvider() {
  return (req: CSRFRequest, res: Response, next: NextFunction): void => {
    // Add a method to get CSRF token
    res.locals.csrfToken = () => {
      const secret = getOrCreateSecret(req);
      return generateCSRFToken(secret);
    };
    
    next();
  };
}

/**
 * Route handler to get CSRF token
 * GET /api/v1/csrf-token
 */
export function getCsrfToken(req: CSRFRequest, res: Response): void {
  try {
    const secret = getOrCreateSecret(req);
    const token = generateCSRFToken(secret);
    
    res.json({
      csrfToken: token,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate CSRF token',
      code: 'CSRF_GENERATION_ERROR'
    });
  }
}

/**
 * Enhanced CSRF protection for high-security operations
 * Requires both CSRF token and additional verification
 */
export function enhancedCSRFProtection(options: {
  requireDoubleSubmit?: boolean;
  maxAge?: number; // Token max age in milliseconds
} = {}) {
  const { requireDoubleSubmit = true, maxAge = 3600000 } = options; // 1 hour default

  return (req: CSRFRequest, res: Response, next: NextFunction): void => {
    try {
      // First, run standard CSRF protection
      csrfProtection()(req, res, (error) => {
        if (error) {
          return next(error);
        }

        // Additional security checks for high-value operations
        if (requireDoubleSubmit) {
          const headerToken = req.headers['x-csrf-token'] as string;
          const bodyToken = req.body?._csrf as string;
          
          if (!headerToken || !bodyToken || headerToken !== bodyToken) {
            return next(new UnauthorizedError('Double-submit CSRF validation failed'));
          }
        }

        // Check token age (if timestamp is embedded)
        if (maxAge) {
          const tokenTimestamp = req.headers['x-csrf-timestamp'] as string;
          if (tokenTimestamp) {
            const tokenAge = Date.now() - parseInt(tokenTimestamp, 10);
            if (tokenAge > maxAge) {
              return next(new UnauthorizedError('CSRF token expired'));
            }
          }
        }

        next();
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * CSRF configuration for different route types
 */
export const csrfConfigs = {
  // Standard protection for most routes
  standard: csrfProtection(),
  
  // Enhanced protection for sensitive operations
  enhanced: enhancedCSRFProtection({
    requireDoubleSubmit: true,
    maxAge: 1800000 // 30 minutes
  }),
  
  // Relaxed protection for API-only endpoints
  api: csrfProtection({
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'DELETE']
  })
};
