import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getFirestoreClient } from './database.js';
import { User } from '../types/database.js';

interface AuthenticatedSocket extends SocketIOServer {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    organization_id?: string;
  };
}

export const initializeWebSocket = (io: SocketIOServer): void => {
  // Authentication middleware for WebSocket
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      if (!process.env.JWT_SECRET) {
        return next(new Error('JWT_SECRET not configured'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

      if (!decoded.sub) {
        return next(new Error('Invalid token format'));
      }

      // Get user from database
      const firestore = getFirestoreClient();
      const userDoc = await firestore.collection('users').doc(decoded.sub).get();

      if (!userDoc.exists) {
        return next(new Error('User not found'));
      }

      const user = { id: userDoc.id, ...userDoc.data() } as User;

      if (!user.is_active) {
        return next(new Error('User account is deactivated'));
      }

      // Attach user to socket
      socket.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization_id: user.organization_id || undefined
      };

      next();
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: any) => {
    console.log(`User ${socket.user.email} connected to WebSocket`);

    // Join organization room if user belongs to one
    if (socket.user.organization_id) {
      socket.join(`org:${socket.user.organization_id}`);
      console.log(`User ${socket.user.email} joined organization room: org:${socket.user.organization_id}`);
    }

    // Join user-specific room
    socket.join(`user:${socket.user.id}`);

    // Handle post status updates
    socket.on('subscribe:posts', (data: { post_ids?: string[] }) => {
      if (data.post_ids && Array.isArray(data.post_ids)) {
        data.post_ids.forEach(postId => {
          socket.join(`post:${postId}`);
        });
        console.log(`User ${socket.user.email} subscribed to posts: ${data.post_ids.join(', ')}`);
      }
    });

    socket.on('unsubscribe:posts', (data: { post_ids?: string[] }) => {
      if (data.post_ids && Array.isArray(data.post_ids)) {
        data.post_ids.forEach(postId => {
          socket.leave(`post:${postId}`);
        });
        console.log(`User ${socket.user.email} unsubscribed from posts: ${data.post_ids.join(', ')}`);
      }
    });

    // Handle analytics subscriptions
    socket.on('subscribe:analytics', () => {
      if (socket.user.organization_id) {
        socket.join(`analytics:${socket.user.organization_id}`);
        console.log(`User ${socket.user.email} subscribed to analytics`);
      }
    });

    socket.on('unsubscribe:analytics', () => {
      if (socket.user.organization_id) {
        socket.leave(`analytics:${socket.user.organization_id}`);
        console.log(`User ${socket.user.email} unsubscribed from analytics`);
      }
    });

    // Handle notifications
    socket.on('subscribe:notifications', () => {
      // User is automatically subscribed to their user room
      console.log(`User ${socket.user.email} subscribed to notifications`);
    });

    // Handle social account status updates
    socket.on('subscribe:social_accounts', () => {
      if (socket.user.organization_id) {
        socket.join(`social_accounts:${socket.user.organization_id}`);
        console.log(`User ${socket.user.email} subscribed to social account updates`);
      }
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.email} disconnected: ${reason}`);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to VibeTribe WebSocket',
      user: {
        id: socket.user.id,
        name: socket.user.name,
        organization_id: socket.user.organization_id
      },
      timestamp: new Date().toISOString()
    });
  });

  console.log('✅ WebSocket server initialized');
};

// Helper functions to emit events from other parts of the application
export const emitToUser = (io: SocketIOServer, userId: string, event: string, data: any): void => {
  io.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });
};

export const emitToOrganization = (io: SocketIOServer, organizationId: string, event: string, data: any): void => {
  io.to(`org:${organizationId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });
};

export const emitPostUpdate = (io: SocketIOServer, postId: string, data: any): void => {
  io.to(`post:${postId}`).emit('post:updated', {
    post_id: postId,
    ...data,
    timestamp: new Date().toISOString()
  });
};

export const emitAnalyticsUpdate = (io: SocketIOServer, organizationId: string, data: any): void => {
  io.to(`analytics:${organizationId}`).emit('analytics:updated', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

export const emitSocialAccountUpdate = (io: SocketIOServer, organizationId: string, data: any): void => {
  io.to(`social_accounts:${organizationId}`).emit('social_account:updated', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

export const emitNotification = (io: SocketIOServer, userId: string, notification: any): void => {
  io.to(`user:${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date().toISOString()
  });
};

export default {
  initializeWebSocket,
  emitToUser,
  emitToOrganization,
  emitPostUpdate,
  emitAnalyticsUpdate,
  emitSocialAccountUpdate,
  emitNotification
};
