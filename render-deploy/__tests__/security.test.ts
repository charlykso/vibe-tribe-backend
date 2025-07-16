// Using Jest globals (no import needed in Jest environment)
import request from 'supertest';
import express from 'express';
import { sanitizeString, sanitizeEmail, sanitizeUrl, validators } from '../middleware/inputSanitization';
import { createAdvancedRateLimit, clearRateLimitStore } from '../middleware/advancedRateLimit';
import { csrfTokenGenerator, csrfProtection } from '../middleware/csrfProtection';
import { comprehensiveSecurityHeaders } from '../middleware/securityHeaders';

describe('Security Middleware Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    clearRateLimitStore(); // Clean up rate limit store between tests
  });

  describe('Input Sanitization', () => {
    describe('sanitizeString', () => {
      it('should remove HTML tags in strict mode', () => {
        const input = '<script>alert("xss")</script>Hello World';
        const result = sanitizeString(input, { level: 'strict' });
        expect(result).toBe('Hello World');
      });

      it('should allow basic HTML tags in moderate mode', () => {
        const input = '<b>Bold</b> and <script>alert("xss")</script>normal text';
        const result = sanitizeString(input, { level: 'moderate' });
        expect(result).toBe('<b>Bold</b> and normal text');
      });

      it('should trim whitespace when enabled', () => {
        const input = '  Hello World  ';
        const result = sanitizeString(input, { level: 'strict', trimWhitespace: true });
        expect(result).toBe('Hello World');
      });

      it('should throw error for strings exceeding max length', () => {
        const input = 'a'.repeat(1001);
        expect(() => sanitizeString(input, { level: 'strict', maxLength: 1000 }))
          .toThrow('Input exceeds maximum length');
      });
    });

    describe('sanitizeEmail', () => {
      it('should validate and normalize valid emails', () => {
        const input = '  TEST@EXAMPLE.COM  ';
        const result = sanitizeEmail(input);
        expect(result).toBe('test@example.com');
      });

      it('should throw error for invalid emails', () => {
        expect(() => sanitizeEmail('invalid-email')).toThrow('Invalid email format');
        expect(() => sanitizeEmail('test@')).toThrow('Invalid email format');
        expect(() => sanitizeEmail('@example.com')).toThrow('Invalid email format');
      });

      it('should throw error for emails that are too long', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        expect(() => sanitizeEmail(longEmail)).toThrow('Email address is too long');
      });
    });

    describe('sanitizeUrl', () => {
      it('should validate valid URLs', () => {
        const validUrls = [
          'https://example.com',
          'http://subdomain.example.com/path',
          'https://example.com:8080/path?query=value'
        ];

        validUrls.forEach(url => {
          expect(() => sanitizeUrl(url)).not.toThrow();
        });
      });

      it('should throw error for invalid URLs', () => {
        const invalidUrls = [
          'not-a-url',
          'ftp://example.com',
          'javascript:alert("xss")',
          'data:text/html,<script>alert("xss")</script>'
        ];

        invalidUrls.forEach(url => {
          expect(() => sanitizeUrl(url)).toThrow('Invalid URL format');
        });
      });
    });

    describe('validators', () => {
      it('should validate usernames correctly', () => {
        expect(validators.username('validuser123')).toBe('validuser123');
        expect(validators.username('user_name-123')).toBe('user_name-123');
        
        expect(() => validators.username('ab')).toThrow('at least 3 characters');
        expect(() => validators.username('user@name')).toThrow('can only contain letters');
        expect(() => validators.username('user name')).toThrow('can only contain letters');
      });

      it('should validate passwords correctly', () => {
        expect(validators.password('ValidPass123')).toBe('ValidPass123');
        
        expect(() => validators.password('short')).toThrow('at least 8 characters');
        expect(() => validators.password('a'.repeat(129))).toThrow('too long');
      });

      it('should validate organization names correctly', () => {
        expect(validators.organizationName('My Company')).toBe('My Company');
        
        expect(() => validators.organizationName('A')).toThrow('at least 2 characters');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const rateLimiter = createAdvancedRateLimit({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: () => 'test-key'
      });

      app.use(rateLimiter);
      app.get('/test', (req: any, res: any) => res.json({ success: true }));

      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.headers['x-ratelimit-remaining']).toBe((4 - i).toString());
      }
    });

    it('should block requests exceeding limit', async () => {
      const rateLimiter = createAdvancedRateLimit({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: () => 'test-key-2'
      });

      app.use(rateLimiter);
      app.get('/test', (req: any, res: any) => res.json({ success: true }));

      // First 2 requests should succeed
      await request(app).get('/test').expect(200);
      await request(app).get('/test').expect(200);

      // Third request should be rate limited
      const response = await request(app).get('/test');
      expect(response.status).toBe(429);
      expect(response.body.error).toContain('Too many requests');
    });

    it('should set correct rate limit headers', async () => {
      const rateLimiter = createAdvancedRateLimit({
        windowMs: 60000,
        maxRequests: 10,
        keyGenerator: () => 'test-key-3'
      });

      app.use(rateLimiter);
      app.get('/test', (req: any, res: any) => res.json({ success: true }));

      const response = await request(app).get('/test');
      
      expect(response.headers['x-ratelimit-limit']).toBe('10');
      expect(response.headers['x-ratelimit-remaining']).toBe('9');
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('CSRF Protection', () => {
    it('should generate CSRF tokens', async () => {
      app.use(csrfTokenGenerator());
      app.get('/test', (req: any, res: any) => {
        res.json({ token: req.csrfToken });
      });

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.headers['x-csrf-token']).toBeDefined();
    });

    it('should allow GET requests without CSRF token', async () => {
      app.use(csrfProtection());
      app.get('/test', (req: any, res: any) => res.json({ success: true }));

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });

    it('should block POST requests without CSRF token for non-API routes', async () => {
      app.use(csrfProtection());
      app.post('/form-submit', (req: any, res: any) => res.json({ success: true }));

      const response = await request(app).post('/form-submit');
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('CSRF token missing');
    });

    it('should allow API requests with JWT authorization', async () => {
      app.use(csrfProtection());
      app.post('/api/test', (req: any, res: any) => res.json({ success: true }));

      const response = await request(app)
        .post('/api/test')
        .set('Authorization', 'Bearer fake-jwt-token');
      
      expect(response.status).toBe(200);
    });
  });

  describe('Security Headers', () => {
    it('should set comprehensive security headers', async () => {
      app.use(...comprehensiveSecurityHeaders());
      app.get('/test', (req: any, res: any) => res.json({ success: true }));

      const response = await request(app).get('/test');
      
      // Check for key security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should include custom security headers', async () => {
      app.use(...comprehensiveSecurityHeaders());
      app.get('/test', (req: any, res: any) => res.json({ success: true }));

      const response = await request(app).get('/test');
      
      expect(response.headers['x-api-version']).toBeDefined();
      expect(response.headers['cache-control']).toContain('no-store');
      expect(response.headers['pragma']).toBe('no-cache');
    });
  });

  describe('Integration Tests', () => {
    it('should handle malicious input through the full pipeline', async () => {
      // Set up full security middleware stack
      app.use(...comprehensiveSecurityHeaders());
      app.use(createAdvancedRateLimit({
        windowMs: 60000,
        maxRequests: 100,
        keyGenerator: () => 'integration-test'
      }));

      // Apply input sanitization
      const { sanitizers } = await import('../middleware/inputSanitization');
      app.use(sanitizers.userContent);

      app.post('/api/test', (req: any, res: any) => {
        res.json({
          received: req.body,
          sanitized: true
        });
      });

      const maliciousPayload = {
        name: '<script>alert("xss")</script>John Doe',
        email: '  MALICIOUS@EXAMPLE.COM  ',
        content: '<img src="x" onerror="alert(\'xss\')" />Hello World'
      };

      const response = await request(app)
        .post('/api/test')
        .send(maliciousPayload);

      expect(response.status).toBe(200);
      
      // Verify that malicious content was sanitized
      expect(response.body.received.name).not.toContain('<script>');
      expect(response.body.received.content).not.toContain('onerror');
      
      // Verify security headers are present
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });
  });
});
