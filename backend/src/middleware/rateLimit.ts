import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// OAuth rate limiter
export const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many OAuth requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later'
    });
  }
});

// Token refresh rate limiter (more strict)
export const tokenRefreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 requests per hour
  message: 'Too many token refresh requests from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many token refresh requests, please try again later'
    });
  }
});

// Middleware to check if rate limit is exceeded
export const checkRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const rateLimitInfo = res.getHeader('RateLimit-Remaining');
  if (rateLimitInfo === '0') {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded, please try again later'
    });
  }
  next();
}; 