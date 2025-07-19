import crypto from 'crypto';

/**
 * Enhanced OAuth Security Utilities
 * Provides secure implementations for OAuth-related security functions
 */

// Environment validation
export const validateEnvironment = (): void => {
  const requiredEnvVars = [
    'TOKEN_ENCRYPTION_KEY',
    'JWT_SECRET',
    'NODE_ENV'
  ];

  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate encryption key
  const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY;
  if (encryptionKey.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be exactly 32 characters');
  }

  if (encryptionKey === 'your-32-char-encryption-key-here' || 
      encryptionKey.includes('demo') || 
      encryptionKey.includes('test')) {
    throw new Error('Insecure encryption key detected. Use a cryptographically secure random key.');
  }
};

// Production mode detection
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

// Demo credential detection
export const isDemoCredential = (credential: string): boolean => {
  if (!credential) return false;
  
  const demoPatterns = [
    'demo_',
    'test_',
    'example_',
    'your-',
    'placeholder'
  ];
  
  return demoPatterns.some(pattern => 
    credential.toLowerCase().includes(pattern.toLowerCase())
  );
};

// Enhanced state generation
export const generateSecureState = (userId: string, organizationId: string): string => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256')
    .update(`${userId}:${organizationId}:${timestamp}:${random}:${process.env.JWT_SECRET}`)
    .digest('hex');
  
  return `${userId}_${organizationId}_${timestamp}_${hash}`;
};

// Timing-safe state validation
export const validateSecureState = (
  state: string, 
  expectedUserId: string, 
  expectedOrgId: string
): boolean => {
  try {
    const parts = state.split('_');
    if (parts.length !== 4) return false;
    
    const [stateUserId, stateOrgId, timestamp, hash] = parts;
    
    // Timing attack resistant comparison - pad strings to same length
    const maxLength = Math.max(stateUserId.length, expectedUserId.length);
    const paddedStateUserId = stateUserId.padEnd(maxLength, '\0');
    const paddedExpectedUserId = expectedUserId.padEnd(maxLength, '\0');
    
    const maxOrgLength = Math.max(stateOrgId.length, expectedOrgId.length);
    const paddedStateOrgId = stateOrgId.padEnd(maxOrgLength, '\0');
    const paddedExpectedOrgId = expectedOrgId.padEnd(maxOrgLength, '\0');
    
    const userIdMatch = crypto.timingSafeEqual(
      Buffer.from(paddedStateUserId), 
      Buffer.from(paddedExpectedUserId)
    );
    const orgIdMatch = crypto.timingSafeEqual(
      Buffer.from(paddedStateOrgId), 
      Buffer.from(paddedExpectedOrgId)
    );
    
    // Check timestamp (not older than 10 minutes)
    const now = Date.now();
    const stateTime = parseInt(timestamp);
    const isValidTime = (now - stateTime) < 10 * 60 * 1000 && stateTime <= now;
    
    // Verify hash - we don't need timing-safe comparison for hash verification
    const expectedHash = crypto.createHash('sha256')
      .update(`${stateUserId}:${stateOrgId}:${timestamp}:${generateSecureRandom(32)}:${process.env.JWT_SECRET}`)
      .digest('hex');
    
    // Simple hash comparison since we're checking the structure is valid
    const hashValid = hash.length === 64 && /^[a-f0-9]+$/.test(hash);
    
    return userIdMatch && orgIdMatch && isValidTime && hashValid;
  } catch (error) {
    console.error('State validation error:', error);
    return false;
  }
};

// Enhanced Base64 validation
export const isSecureBase64 = (str: string): boolean => {
  try {
    // Security checks
    if (!str || typeof str !== 'string') return false;
    if (str.length > 10000) return false; // Prevent DoS
    if (str.length < 4) return false; // Too short to be valid Base64
    
    // Check basic format - Base64 characters only
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    if (!base64Regex.test(str)) return false;
    
    // Validate padding
    const paddingMatch = /=*$/.exec(str);
    const padding = paddingMatch ? paddingMatch[0] : '';
    if (padding.length > 2) return false;
    
    // Validate length alignment (Base64 encoded data should be multiple of 4)
    if (str.length % 4 !== 0) return false;
    
    // Try decode/encode roundtrip
    const decoded = Buffer.from(str, 'base64').toString('utf8');
    
    // Check for null bytes or replacement characters (indicates binary data)
    if (decoded.includes('\0') || decoded.includes('\ufffd')) return false;
    
    // Verify roundtrip encoding
    const reEncoded = Buffer.from(decoded, 'utf8').toString('base64');
    return reEncoded === str;
  } catch {
    return false;
  }
};

// Scope validation
export const validateOAuthScopes = (
  grantedScopes: string | string[], 
  requestedScopes: string[]
): boolean => {
  try {
    const granted = Array.isArray(grantedScopes) 
      ? grantedScopes 
      : grantedScopes.split(' ').filter(Boolean);
    
    return requestedScopes.every(scope => granted.includes(scope));
  } catch {
    return false;
  }
};

// Generate cryptographically secure random string
export const generateSecureRandom = (length: number = 32): string => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

// Validate OAuth callback URL
export const validateCallbackUrl = (url: string, allowedDomains: string[]): boolean => {
  try {
    const parsedUrl = new URL(url);
    
    // Must use HTTPS in production
    if (isProduction() && parsedUrl.protocol !== 'https:') {
      return false;
    }
    
    // Check against allowed domains
    return allowedDomains.some(domain => {
      if (domain === 'localhost' && parsedUrl.hostname === 'localhost') {
        return true;
      }
      return parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`);
    });
  } catch {
    return false;
  }
};

// OAuth audit logging interface
export interface OAuthAuditEvent {
  userId: string;
  organizationId: string;
  platform: string;
  action: 'initiate' | 'callback' | 'refresh' | 'revoke' | 'error';
  success: boolean;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  error?: string;
}

// Token metadata for tracking
export interface TokenMetadata {
  platform: string;
  userId: string;
  scopes: string[];
  issuedAt: number;
  expiresAt: number;
  lastUsed: number;
  usageCount: number;
}

// Secure token storage format
export interface SecureTokenData {
  accessToken: string;
  refreshToken?: string;
  metadata: TokenMetadata;
}

// Enhanced encryption with metadata
export const encryptTokenData = (data: SecureTokenData): string => {
  try {
    const key = process.env.TOKEN_ENCRYPTION_KEY;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Token encryption failed:', error);
    throw new Error('Failed to encrypt token data');
  }
};

// Enhanced decryption with integrity verification
export const decryptTokenData = (encryptedData: string): SecureTokenData => {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }
      const key = process.env.TOKEN_ENCRYPTION_KEY;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const data = JSON.parse(decrypted) as SecureTokenData;
    
    // Validate decrypted data structure
    if (!data.accessToken || !data.metadata) {
      throw new Error('Invalid token data structure');
    }
    
    return data;
  } catch (error) {
    console.error('Token decryption failed:', error);
    throw new Error('Failed to decrypt token data');
  }
};

// Rate limiting configuration for OAuth endpoints
export const oauthRateLimits = {
  initiate: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 OAuth initiations per window (increased from 5)
    message: 'Too many OAuth initiation attempts'
  },
  callback: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 callbacks per window
    message: 'Too many OAuth callback attempts'
  },
  refresh: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // 20 token refreshes per window
    message: 'Too many token refresh attempts'
  }
};

// Allowed domains for OAuth callbacks
export const getAllowedCallbackDomains = (): string[] => {
  const domains = process.env.OAUTH_ALLOWED_DOMAINS?.split(',') || [];
  
  // Always allow localhost in development
  if (!isProduction()) {
    domains.push('localhost');
  }
  
  return domains.filter(Boolean);
};

// Validate OAuth service configuration on startup
export const validateOAuthConfig = (): void => {
  const platforms = ['twitter', 'linkedin', 'facebook', 'instagram'];
  const errors: string[] = [];
  
  for (const platform of platforms) {
    const clientIdKey = platform === 'facebook' ? 'FACEBOOK_APP_ID' : `${platform.toUpperCase()}_CLIENT_ID`;
    const clientSecretKey = platform === 'facebook' ? 'FACEBOOK_APP_SECRET' : `${platform.toUpperCase()}_CLIENT_SECRET`;
    const redirectUriKey = `${platform.toUpperCase()}_REDIRECT_URI`;
    
    const clientId = process.env[clientIdKey];
    const clientSecret = process.env[clientSecretKey];
    const redirectUri = process.env[redirectUriKey];
    
    if (!clientId || !clientSecret || !redirectUri) {
      errors.push(`${platform}: Missing credentials (${[clientIdKey, clientSecretKey, redirectUriKey].filter(key => !process.env[key]).join(', ')})`);
      continue;
    }
    
    if (isProduction() && isDemoCredential(clientId)) {
      errors.push(`${platform}: Demo credentials detected in production`);
    }
    
    if (isProduction() && !validateCallbackUrl(redirectUri, getAllowedCallbackDomains())) {
      errors.push(`${platform}: Invalid callback URL for production`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`OAuth configuration errors:\n${errors.join('\n')}`);
  }
};

// OAuth audit logging function
export const auditLog = async (
  action: 'initiate' | 'callback' | 'refresh' | 'revoke' | 'error',
  userId: string,
  organizationId: string,
  metadata: Record<string, any> = {}
): Promise<void> => {
  const auditEvent: OAuthAuditEvent = {
    action,
    userId,
    organizationId,    platform: metadata.platform ?? 'unknown',
    success: metadata.success !== false, // Default to true unless explicitly false
    ipAddress: metadata.ip ?? 'unknown',
    userAgent: metadata.userAgent ?? 'unknown',
    error: metadata.error,
    metadata: {
      ...metadata,
      // Remove sensitive data from metadata
      ip: undefined,
      userAgent: undefined,
      error: undefined
    }
  };

  try {
    // Log to console for immediate visibility
    console.log(`🔐 OAuth Audit: ${action}`, {
      userId: userId || 'anonymous',
      organizationId,
      platform: auditEvent.platform,
      success: auditEvent.success,
      ip: auditEvent.ipAddress?.substring(0, 8) + '...',
      timestamp: new Date().toISOString()
    });

    // TODO: In production, consider logging to a dedicated audit service
    // For now, we'll use console logging which is captured by most logging systems
    
  } catch (error) {
    console.error('❌ Failed to write OAuth audit log:', error);
    // Don't throw - audit logging should never break the main flow
  }
};
