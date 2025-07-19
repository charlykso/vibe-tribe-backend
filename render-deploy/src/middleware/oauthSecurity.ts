import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { 
  validateEnvironment,
  isProduction,
  validateCallbackUrl,
  getAllowedCallbackDomains,
  oauthRateLimits,
  OAuthAuditEvent
} from '../services/oauthSecurity.js';
import { getFirestoreClient } from '../services/database.js';
import { redis, getRedisKey, REDIS_PREFIX } from '../services/redis.js';

/**
 * Enhanced OAuth Security Middleware
 * Implements comprehensive security measures for OAuth flows
 */

// Validate OAuth configuration on module load
try {
  validateEnvironment();
  console.log('✅ OAuth environment validation passed');
} catch (error) {
  console.error('❌ OAuth environment validation failed:', error);
  if (isProduction()) {
    process.exit(1); // Fail fast in production
  }
}

// OAuth-specific rate limiters
export const oauthInitiateRateLimit = rateLimit({
  windowMs: oauthRateLimits.initiate.windowMs,
  max: oauthRateLimits.initiate.max,
  message: { error: oauthRateLimits.initiate.message },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    const userId = (req as any).user?.id;
    return userId ? `oauth_initiate_user_${userId}` : `oauth_initiate_ip_${req.ip}`;
  },
  skip: (req) => {
    // Skip rate limiting for internal requests in development
    if (!isProduction() && req.headers['x-internal-request'] === 'true') {
      return true;
    }

    // Temporarily skip rate limiting for debug endpoints
    if (req.path?.includes('/debug/')) {
      return true;
    }

    // Skip rate limiting if debug mode is enabled via environment variable
    if (process.env.OAUTH_DEBUG_MODE === 'true') {
      console.log('🧪 OAuth rate limiting bypassed due to debug mode');
      return true;
    }

    return false;
  }
});

export const oauthCallbackRateLimit = rateLimit({
  windowMs: oauthRateLimits.callback.windowMs,
  max: oauthRateLimits.callback.max,
  message: { error: oauthRateLimits.callback.message },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `oauth_callback_ip_${req.ip}`
});

export const oauthRefreshRateLimit = rateLimit({
  windowMs: oauthRateLimits.refresh.windowMs,
  max: oauthRateLimits.refresh.max,
  message: { error: oauthRateLimits.refresh.message },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as any).user?.id;
    return userId ? `oauth_refresh_user_${userId}` : `oauth_refresh_ip_${req.ip}`;
  }
});

// OAuth-specific security headers
export const oauthSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Add OAuth-specific CSP
  const csp = [
    "default-src 'self'",
    "connect-src 'self' https://api.twitter.com https://www.linkedin.com https://graph.facebook.com https://api.instagram.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Prevent caching of OAuth responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
};

// Validate callback URL middleware
export const validateOAuthCallbackUrl = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { platform } = req.body;
    const redirectUriKey = platform === 'facebook' 
      ? 'FACEBOOK_REDIRECT_URI' 
      : `${platform.toUpperCase()}_REDIRECT_URI`;
    
    const redirectUri = process.env[redirectUriKey];
    
    if (!redirectUri) {
      return res.status(400).json({
        error: 'OAuth redirect URI not configured',
        platform
      });
    }
    
    const allowedDomains = getAllowedCallbackDomains();
    
    if (!validateCallbackUrl(redirectUri, allowedDomains)) {
      console.error(`Invalid OAuth callback URL for ${platform}:`, redirectUri);
      return res.status(400).json({
        error: 'Invalid OAuth callback URL configuration',
        platform
      });
    }
    
    next();
  } catch (error) {
    console.error('OAuth callback URL validation error:', error);
    res.status(500).json({
      error: 'OAuth configuration validation failed'
    });
  }
};

// OAuth audit logging middleware
export const auditOAuthEvent = async (event: OAuthAuditEvent): Promise<void> => {
  try {
    const firestore = getFirestoreClient();
    const timestamp = new Date();
    
    const auditRecord = {
      ...event,
      timestamp,
      environment: process.env.NODE_ENV || 'unknown'
    };
    
    // Store in Firestore
    await firestore.collection('oauth_audit_logs').add(auditRecord);
    
    // Also store in Redis for quick access (expire after 24 hours)
    const redisKey = getRedisKey(REDIS_PREFIX.OAUTH_AUDIT, `${event.userId}_${Date.now()}`);
    await redis.setex(redisKey, 24 * 60 * 60, JSON.stringify(auditRecord));
    
    console.log(`OAuth audit logged: ${event.action} for ${event.platform} by user ${event.userId}`);
  } catch (error) {
    console.error('Failed to log OAuth audit event:', error);
    // Don't throw - audit logging shouldn't break the OAuth flow
  }
};

// Middleware to extract and validate OAuth request metadata
export const extractOAuthMetadata = (req: Request, res: Response, next: NextFunction) => {
  try {
    const metadata = {
      ipAddress: req.ip ?? req.socket.remoteAddress ?? 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] ?? `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    };
    
    // Attach metadata to request for use in OAuth handlers
    (req as any).oauthMetadata = metadata;
    
    // Log request metadata in development
    if (!isProduction()) {
      console.log('OAuth request metadata:', {
        path: req.path,
        method: req.method,
        ...metadata
      });
    }
    
    next();
  } catch (error) {
    console.error('Failed to extract OAuth metadata:', error);
    next(); // Continue even if metadata extraction fails
  }
};

// Validate OAuth platform parameter
export const validateOAuthPlatform = (req: Request, res: Response, next: NextFunction) => {
  const allowedPlatforms = ['twitter', 'linkedin', 'facebook', 'instagram'];
  const { platform } = req.body;
  
  if (!platform || !allowedPlatforms.includes(platform)) {
    return res.status(400).json({
      error: 'Invalid or missing platform parameter',
      allowedPlatforms
    });
  }
  
  next();
};

// Production security checks
export const productionSecurityChecks = (req: Request, res: Response, next: NextFunction) => {
  if (!isProduction()) {
    return next();
  }
  
  try {
    // Ensure HTTPS in production
    if (req.header('x-forwarded-proto') !== 'https' && !req.secure) {
      return res.status(400).json({
        error: 'HTTPS required in production'
      });
    }
    
    // Validate origin header
    const origin = req.headers.origin;
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
    
    if (origin && !allowedOrigins.includes(origin)) {
      console.warn('Unauthorized origin attempted OAuth request:', origin);
      return res.status(403).json({
        error: 'Unauthorized origin'
      });
    }
    
    next();
  } catch (error) {
    console.error('Production security check failed:', error);
    res.status(500).json({
      error: 'Security validation failed'
    });
  }
};

// OAuth state tampering protection
export const protectOAuthState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { state } = req.body;
    
    if (!state) {
      return res.status(400).json({
        error: 'OAuth state parameter is required'
      });
    }
    
    // Check if state has been used before (prevent replay attacks)
    const stateKey = getRedisKey(REDIS_PREFIX.OAUTH_USED_STATES, state);
    const usedBefore = await redis.get(stateKey);
    
    if (usedBefore) {
      console.warn('OAuth state reuse detected:', state.substring(0, 20) + '...');
      return res.status(400).json({
        error: 'OAuth state parameter has already been used'
      });
    }
    
    // Mark state as used (expire after 1 hour)
    await redis.setex(stateKey, 60 * 60, Date.now().toString());
    
    next();
  } catch (error) {
    console.error('OAuth state protection error:', error);
    res.status(500).json({
      error: 'OAuth state validation failed'
    });
  }
};

// Comprehensive OAuth middleware stack
export const oauthSecurityMiddleware = {
  initiate: [
    oauthSecurityHeaders,
    extractOAuthMetadata,
    validateOAuthPlatform,
    validateOAuthCallbackUrl,
    productionSecurityChecks,
    oauthInitiateRateLimit
  ],
  callback: [
    oauthSecurityHeaders,
    extractOAuthMetadata,
    validateOAuthPlatform,
    protectOAuthState,
    productionSecurityChecks,
    oauthCallbackRateLimit
  ],
  refresh: [
    oauthSecurityHeaders,
    extractOAuthMetadata,
    productionSecurityChecks,
    oauthRefreshRateLimit
  ]
};

// OAuth error handler
export const oauthErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('OAuth error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    metadata: (req as any).oauthMetadata
  });
  
  // Log security events
  if (error.message.includes('security') || error.message.includes('unauthorized')) {
    auditOAuthEvent({      userId: (req as any).user?.id ?? 'unknown',
      organizationId: (req as any).user?.organization_id ?? 'unknown',
      platform: req.body?.platform ?? 'unknown',
      action: 'error',
      success: false,
      ipAddress: (req as any).oauthMetadata?.ipAddress ?? 'unknown',
      userAgent: (req as any).oauthMetadata?.userAgent ?? 'unknown',
      error: error.message
    });
  }
  
  // Don't expose detailed error information in production
  const errorMessage = isProduction() 
    ? 'OAuth operation failed' 
    : error.message;
  
  res.status(500).json({
    error: errorMessage,
    requestId: (req as any).oauthMetadata?.requestId
  });
};

// Cleanup expired OAuth states and audit logs
export const cleanupOAuthData = async (): Promise<void> => {
  try {
    const firestore = getFirestoreClient();
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Clean up old audit logs (older than 30 days)
    const oldAuditLogs = await firestore
      .collection('oauth_audit_logs')
      .where('timestamp', '<', new Date(thirtyDaysAgo))
      .limit(100)
      .get();
    
    if (!oldAuditLogs.empty) {
      const batch = firestore.batch();
      oldAuditLogs.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`Cleaned up ${oldAuditLogs.size} old OAuth audit logs`);
    }
    
    // Clean up expired Redis keys
    const expiredKeys = await redis.keys(`${REDIS_PREFIX.OAUTH_STATE}*`);
    let cleanedCount = 0;
    
    for (const key of expiredKeys) {
      const ttl = await redis.ttl(key);
      if (ttl <= 0) {
        await redis.del(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired OAuth Redis keys`);
    }
  } catch (error) {
    console.error('OAuth cleanup error:', error);
  }
};

// Run cleanup every hour
setInterval(cleanupOAuthData, 60 * 60 * 1000);

export default oauthSecurityMiddleware;
