import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getFirestoreClient } from '../services/database.js';
import { User } from '../types/database.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    organization_id?: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    if (!decoded.sub) {
      res.status(401).json({
        error: 'Invalid token format.',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    // Get user from Firestore
    const firestore = getFirestoreClient();
    const userDoc = await firestore.collection('users').doc(decoded.sub).get();

    if (!userDoc.exists) {
      res.status(401).json({
        error: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    const user = { id: userDoc.id, ...userDoc.data() } as User;

    if (!user.is_active) {
      res.status(401).json({
        error: 'Account is deactivated.',
        code: 'ACCOUNT_DEACTIVATED'
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization_id: user.organization_id || undefined
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        required_roles: roles,
        user_role: req.user.role
      });
      return;
    }

    next();
  };
};

export const requireOrganization = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  if (!req.user.organization_id) {
    res.status(403).json({
      error: 'Organization membership required.',
      code: 'NO_ORGANIZATION'
    });
    return;
  }

  next();
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!process.env.JWT_SECRET) {
      next();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    if (decoded.sub) {
      const firestore = getFirestoreClient();
      const userDoc = await firestore.collection('users').doc(decoded.sub).get();

      if (userDoc.exists) {
        const user = { id: userDoc.id, ...userDoc.data() } as User;

        if (user.is_active) {
          req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organization_id: user.organization_id || undefined
          };
        }
      }
    }

    next();
  } catch (error) {
    // If optional auth fails, just continue without user
    next();
  }
};
