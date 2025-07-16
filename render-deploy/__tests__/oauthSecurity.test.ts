import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import crypto from 'crypto';
import {
  validateEnvironment,
  isProduction,
  isDemoCredential,
  generateSecureState,
  validateSecureState,
  isSecureBase64,
  validateOAuthScopes,
  generateSecureRandom,
  validateCallbackUrl,
  encryptTokenData,
  decryptTokenData,
  validateOAuthConfig,
  getAllowedCallbackDomains,
  SecureTokenData,
  TokenMetadata
} from '../services/oauthSecurity';

describe('OAuth Security Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      TOKEN_ENCRYPTION_KEY: 'a'.repeat(32), // 32 char key
      JWT_SECRET: 'test-jwt-secret',
      NODE_ENV: 'test'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment Validation', () => {
    it('should pass with valid environment variables', () => {
      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should fail with missing TOKEN_ENCRYPTION_KEY', () => {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      expect(() => validateEnvironment()).toThrow('Missing required environment variables');
    });

    it('should fail with invalid encryption key length', () => {
      process.env.TOKEN_ENCRYPTION_KEY = 'short';
      expect(() => validateEnvironment()).toThrow('must be exactly 32 characters');
    });

    it('should fail with demo encryption key', () => {
      process.env.TOKEN_ENCRYPTION_KEY = 'your-32-char-encryption-key-here';
      expect(() => validateEnvironment()).toThrow('Insecure encryption key detected');
    });
  });

  describe('Production Mode Detection', () => {
    it('should detect production mode', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).toBe(true);
    });

    it('should detect non-production mode', () => {
      process.env.NODE_ENV = 'development';
      expect(isProduction()).toBe(false);
    });
  });

  describe('Demo Credential Detection', () => {
    it('should detect demo credentials', () => {
      expect(isDemoCredential('demo_client_id')).toBe(true);
      expect(isDemoCredential('test_secret')).toBe(true);
      expect(isDemoCredential('example_token')).toBe(true);
      expect(isDemoCredential('your-api-key')).toBe(true);
      expect(isDemoCredential('placeholder_value')).toBe(true);
    });

    it('should not flag real credentials', () => {
      expect(isDemoCredential('real_production_key_123')).toBe(false);
      expect(isDemoCredential('abcd1234567890')).toBe(false);
      expect(isDemoCredential('')).toBe(false);
    });
  });

  describe('Secure State Generation and Validation', () => {
    const userId = 'user123';
    const orgId = 'org456';

    it('should generate and validate secure state', () => {
      const state = generateSecureState(userId, orgId);
      expect(state).toMatch(/^user123_org456_\d+_[a-f0-9]+$/);
      expect(validateSecureState(state, userId, orgId)).toBe(true);
    });

    it('should reject invalid state format', () => {
      expect(validateSecureState('invalid_state', userId, orgId)).toBe(false);
      expect(validateSecureState('user123_org456_invalid', userId, orgId)).toBe(false);
    });

    it('should reject state with wrong user ID', () => {
      const state = generateSecureState(userId, orgId);
      expect(validateSecureState(state, 'wrong_user', orgId)).toBe(false);
    });

    it('should reject state with wrong organization ID', () => {
      const state = generateSecureState(userId, orgId);
      expect(validateSecureState(state, userId, 'wrong_org')).toBe(false);
    });

    it('should reject expired state', () => {
      // Mock old timestamp
      const oldTimestamp = Date.now() - (11 * 60 * 1000); // 11 minutes ago
      const hash = crypto.createHash('sha256')
        .update(`${userId}:${orgId}:${oldTimestamp}:test:${process.env.JWT_SECRET}`)
        .digest('hex');
      const expiredState = `${userId}_${orgId}_${oldTimestamp}_${hash}`;
      
      expect(validateSecureState(expiredState, userId, orgId)).toBe(false);
    });
  });

  describe('Base64 Validation', () => {
    it('should validate correct Base64 strings', () => {
      expect(isSecureBase64('SGVsbG8gV29ybGQ=')).toBe(true); // "Hello World"
      expect(isSecureBase64('VGVzdA==')).toBe(true); // "Test"
    });

    it('should reject invalid Base64 strings', () => {
      expect(isSecureBase64('')).toBe(false);
      expect(isSecureBase64('invalid!')).toBe(false);
      expect(isSecureBase64('SGVsbG8g====')).toBe(false); // Too much padding
      expect(isSecureBase64('a')).toBe(false); // Too short
    });

    it('should reject overly long strings', () => {
      const longString = 'A'.repeat(10001);
      expect(isSecureBase64(longString)).toBe(false);
    });

    it('should reject binary data disguised as Base64', () => {
      const binaryData = Buffer.from('\0\ufffd').toString('base64');
      expect(isSecureBase64(binaryData)).toBe(false);
    });
  });

  describe('OAuth Scope Validation', () => {
    it('should validate matching scopes', () => {
      const granted = ['read', 'write', 'admin'];
      const requested = ['read', 'write'];
      expect(validateOAuthScopes(granted, requested)).toBe(true);
    });

    it('should handle space-separated scope strings', () => {
      const granted = 'read write admin';
      const requested = ['read', 'write'];
      expect(validateOAuthScopes(granted, requested)).toBe(true);
    });

    it('should reject insufficient scopes', () => {
      const granted = ['read'];
      const requested = ['read', 'write'];
      expect(validateOAuthScopes(granted, requested)).toBe(false);
    });

    it('should handle empty scopes gracefully', () => {
      expect(validateOAuthScopes([], [])).toBe(true);
      expect(validateOAuthScopes('', [])).toBe(true);
      expect(validateOAuthScopes(['read'], [])).toBe(true);
    });
  });

  describe('Secure Random Generation', () => {
    it('should generate random strings of specified length', () => {
      const random1 = generateSecureRandom(16);
      const random2 = generateSecureRandom(16);
      
      expect(random1).toHaveLength(16);
      expect(random2).toHaveLength(16);
      expect(random1).not.toBe(random2);
      expect(random1).toMatch(/^[a-f0-9]+$/);
    });

    it('should use default length of 32', () => {
      const random = generateSecureRandom();
      expect(random).toHaveLength(32);
    });
  });

  describe('Callback URL Validation', () => {
    const allowedDomains = ['example.com', 'localhost'];

    it('should validate allowed domains', () => {
      expect(validateCallbackUrl('https://example.com/callback', allowedDomains)).toBe(true);
      expect(validateCallbackUrl('https://sub.example.com/callback', allowedDomains)).toBe(true);
      expect(validateCallbackUrl('http://localhost:3000/callback', allowedDomains)).toBe(true);
    });

    it('should reject disallowed domains', () => {
      expect(validateCallbackUrl('https://evil.com/callback', allowedDomains)).toBe(false);
      expect(validateCallbackUrl('https://notexample.com/callback', allowedDomains)).toBe(false);
    });

    it('should require HTTPS in production', () => {
      process.env.NODE_ENV = 'production';
      expect(validateCallbackUrl('http://example.com/callback', allowedDomains)).toBe(false);
      expect(validateCallbackUrl('https://example.com/callback', allowedDomains)).toBe(true);
    });

    it('should handle invalid URLs gracefully', () => {
      expect(validateCallbackUrl('not-a-url', allowedDomains)).toBe(false);
      expect(validateCallbackUrl('', allowedDomains)).toBe(false);
    });
  });

  describe('Token Encryption and Decryption', () => {
    const sampleTokenData: SecureTokenData = {
      accessToken: 'access_token_123',
      refreshToken: 'refresh_token_456',
      metadata: {
        platform: 'twitter',
        userId: 'user123',
        scopes: ['read', 'write'],
        issuedAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastUsed: Date.now(),
        usageCount: 1
      }
    };

    it('should encrypt and decrypt token data successfully', () => {
      const encrypted = encryptTokenData(sampleTokenData);
      expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
      
      const decrypted = decryptTokenData(encrypted);
      expect(decrypted).toEqual(sampleTokenData);
    });

    it('should reject tampered encrypted data', () => {
      const encrypted = encryptTokenData(sampleTokenData);
      const tampered = encrypted.replace(/.$/, 'x'); // Change last character
      
      expect(() => decryptTokenData(tampered)).toThrow('Failed to decrypt token data');
    });

    it('should reject invalid encryption format', () => {
      expect(() => decryptTokenData('invalid_format')).toThrow('Failed to decrypt token data');
      expect(() => decryptTokenData('a:b')).toThrow('Failed to decrypt token data');
    });
  });

  describe('OAuth Configuration Validation', () => {
    beforeEach(() => {
      // Set up valid OAuth environment
      process.env.TWITTER_CLIENT_ID = 'valid_twitter_id';
      process.env.TWITTER_CLIENT_SECRET = 'valid_twitter_secret';
      process.env.TWITTER_REDIRECT_URI = 'https://example.com/oauth/twitter/callback';
      
      process.env.LINKEDIN_CLIENT_ID = 'valid_linkedin_id';
      process.env.LINKEDIN_CLIENT_SECRET = 'valid_linkedin_secret';
      process.env.LINKEDIN_REDIRECT_URI = 'https://example.com/oauth/linkedin/callback';
      
      process.env.FACEBOOK_APP_ID = 'valid_facebook_id';
      process.env.FACEBOOK_APP_SECRET = 'valid_facebook_secret';
      process.env.FACEBOOK_REDIRECT_URI = 'https://example.com/oauth/facebook/callback';
      
      process.env.INSTAGRAM_CLIENT_ID = 'valid_instagram_id';
      process.env.INSTAGRAM_CLIENT_SECRET = 'valid_instagram_secret';
      process.env.INSTAGRAM_REDIRECT_URI = 'https://example.com/oauth/instagram/callback';
      
      process.env.OAUTH_ALLOWED_DOMAINS = 'example.com';
    });

    it('should pass with valid OAuth configuration', () => {
      expect(() => validateOAuthConfig()).not.toThrow();
    });

    it('should fail with missing credentials', () => {
      delete process.env.TWITTER_CLIENT_ID;
      expect(() => validateOAuthConfig()).toThrow('OAuth configuration errors');
    });

    it('should fail with demo credentials in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.TWITTER_CLIENT_ID = 'demo_twitter_id';
      expect(() => validateOAuthConfig()).toThrow('Demo credentials detected in production');
    });

    it('should fail with invalid callback URLs in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.TWITTER_REDIRECT_URI = 'http://example.com/callback'; // HTTP not allowed
      expect(() => validateOAuthConfig()).toThrow('Invalid callback URL for production');
    });
  });

  describe('Allowed Domains Configuration', () => {
    it('should parse allowed domains from environment', () => {
      process.env.OAUTH_ALLOWED_DOMAINS = 'example.com,test.com,app.com';
      const domains = getAllowedCallbackDomains();
      expect(domains).toContain('example.com');
      expect(domains).toContain('test.com');
      expect(domains).toContain('app.com');
    });

    it('should include localhost in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.OAUTH_ALLOWED_DOMAINS = 'example.com';
      const domains = getAllowedCallbackDomains();
      expect(domains).toContain('localhost');
      expect(domains).toContain('example.com');
    });

    it('should not include localhost in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.OAUTH_ALLOWED_DOMAINS = 'example.com';
      const domains = getAllowedCallbackDomains();
      expect(domains).not.toContain('localhost');
      expect(domains).toContain('example.com');
    });
  });

  describe('Error Handling', () => {
    it('should handle encryption errors gracefully', () => {
      // Test with invalid key
      process.env.TOKEN_ENCRYPTION_KEY = 'invalid';
      expect(() => validateEnvironment()).toThrow();
    });

    it('should handle state validation errors gracefully', () => {
      expect(validateSecureState('malformed_state', 'user', 'org')).toBe(false);
    });

    it('should handle scope validation errors gracefully', () => {
      expect(validateOAuthScopes(null as any, ['read'])).toBe(false);
      expect(validateOAuthScopes(undefined as any, ['read'])).toBe(false);
    });
  });

  describe('Performance and Security Considerations', () => {
    it('should use timing-safe comparisons for sensitive data', () => {
      const state1 = generateSecureState('user1', 'org1');
      const state2 = generateSecureState('user2', 'org2');
      
      // These should both fail, but timing should be similar
      const start1 = process.hrtime.bigint();
      validateSecureState(state1, 'wrong_user', 'org1');
      const end1 = process.hrtime.bigint();
      
      const start2 = process.hrtime.bigint();
      validateSecureState(state2, 'user2', 'wrong_org');
      const end2 = process.hrtime.bigint();
      
      // Timing difference should be minimal (timing-safe comparison)
      const diff1 = Number(end1 - start1);
      const diff2 = Number(end2 - start2);
      const timingDifference = Math.abs(diff1 - diff2);
      
      // Allow for some variance but ensure it's not dramatically different
      expect(timingDifference).toBeLessThan(diff1 * 0.5); // Less than 50% difference
    });

    it('should prevent excessive memory usage in Base64 validation', () => {
      // This should not consume excessive memory
      const longInvalidString = 'x'.repeat(10001);
      expect(isSecureBase64(longInvalidString)).toBe(false);
    });
  });
});
