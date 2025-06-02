import DOMPurify from 'dompurify';

/**
 * Frontend security utilities for input validation and sanitization
 */

// CSRF token management
let csrfToken: string | null = null;

/**
 * Fetch CSRF token from the server
 */
export async function fetchCSRFToken(): Promise<string> {
  try {
    const response = await fetch('/api/v1/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }
    
    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

/**
 * Get the current CSRF token (fetch if not available)
 */
export async function getCSRFToken(): Promise<string> {
  if (!csrfToken) {
    return await fetchCSRFToken();
  }
  return csrfToken;
}

/**
 * Clear the stored CSRF token (useful on logout)
 */
export function clearCSRFToken(): void {
  csrfToken = null;
}

/**
 * Enhanced fetch wrapper with automatic CSRF token inclusion
 */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';
  
  // Add CSRF token for state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      const token = await getCSRFToken();
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': token
      };
    } catch (error) {
      console.warn('Could not get CSRF token:', error);
    }
  }
  
  // Ensure credentials are included for CSRF protection
  options.credentials = options.credentials || 'include';
  
  return fetch(url, options);
}

/**
 * Input sanitization for frontend
 */
export const sanitize = {
  /**
   * Sanitize HTML content
   */
  html: (input: string, options: {
    allowedTags?: string[];
    allowedAttributes?: string[];
  } = {}): string => {
    const config = {
      ALLOWED_TAGS: options.allowedTags || ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: options.allowedAttributes || [],
      KEEP_CONTENT: true,
      ALLOW_DATA_ATTR: false
    };
    
    return DOMPurify.sanitize(input, config);
  },

  /**
   * Sanitize plain text (remove all HTML)
   */
  text: (input: string): string => {
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true 
    });
  },

  /**
   * Sanitize for display in attributes
   */
  attribute: (input: string): string => {
    return input
      .replace(/[<>"'&]/g, (char) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      });
  }
};

/**
 * Input validation utilities
 */
export const validate = {
  /**
   * Validate email format
   */
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  /**
   * Validate URL format
   */
  url: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  },

  /**
   * Validate username format
   */
  username: (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(username);
  },

  /**
   * Validate password strength
   */
  password: (password: string): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password is too long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate content length
   */
  contentLength: (content: string, maxLength: number): boolean => {
    return content.length <= maxLength;
  },

  /**
   * Validate file type
   */
  fileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  /**
   * Validate file size
   */
  fileSize: (file: File, maxSizeBytes: number): boolean => {
    return file.size <= maxSizeBytes;
  }
};

/**
 * Content Security Policy helpers
 */
export const csp = {
  /**
   * Generate a nonce for inline scripts (if needed)
   */
  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  },

  /**
   * Check if a URL is allowed by CSP
   */
  isAllowedUrl: (url: string, allowedDomains: string[]): boolean => {
    try {
      const urlObj = new URL(url);
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }
};

/**
 * XSS prevention utilities
 */
export const xss = {
  /**
   * Escape HTML entities
   */
  escapeHtml: (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Unescape HTML entities
   */
  unescapeHtml: (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  },

  /**
   * Check for potential XSS patterns
   */
  containsXSS: (input: string): boolean => {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^>]*>/gi,
      /<link\b[^>]*>/gi,
      /<meta\b[^>]*>/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
};

/**
 * Rate limiting helpers for frontend
 */
export const rateLimiting = {
  /**
   * Simple client-side rate limiting
   */
  createRateLimiter: (maxRequests: number, windowMs: number) => {
    const requests: number[] = [];
    
    return {
      canMakeRequest: (): boolean => {
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Remove old requests
        while (requests.length > 0 && requests[0] < windowStart) {
          requests.shift();
        }
        
        // Check if we can make a new request
        if (requests.length < maxRequests) {
          requests.push(now);
          return true;
        }
        
        return false;
      },
      
      getTimeUntilReset: (): number => {
        if (requests.length === 0) return 0;
        return Math.max(0, (requests[0] + windowMs) - Date.now());
      }
    };
  }
};

/**
 * Secure storage utilities
 */
export const secureStorage = {
  /**
   * Store sensitive data with encryption (basic)
   */
  setSecure: (key: string, value: string): void => {
    try {
      // In a real implementation, you'd use proper encryption
      const encoded = btoa(value);
      sessionStorage.setItem(key, encoded);
    } catch (error) {
      console.error('Failed to store secure data:', error);
    }
  },

  /**
   * Retrieve and decrypt sensitive data
   */
  getSecure: (key: string): string | null => {
    try {
      const encoded = sessionStorage.getItem(key);
      if (!encoded) return null;
      return atob(encoded);
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  },

  /**
   * Remove sensitive data
   */
  removeSecure: (key: string): void => {
    sessionStorage.removeItem(key);
  },

  /**
   * Clear all secure storage
   */
  clearAll: (): void => {
    sessionStorage.clear();
  }
};
