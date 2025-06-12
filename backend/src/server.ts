import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/oauth.js';
import invitationRoutes from './routes/invitations.js';
import userRoutes from './routes/users.js';
import socialAccountRoutes from './routes/socialAccounts.js';
import postsRoutes from './routes/posts.js';
import analyticsRoutes from './routes/analytics.js';
import mediaRoutes from './routes/media.js';
// Phase 3 routes
import communitiesRoutes from './routes/communities.js';
import moderationRoutes from './routes/moderation.js';
import aiRoutes from './routes/ai.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authMiddleware } from './middleware/auth.js';
import { sanitizers } from './middleware/inputSanitization.js';
import { csrfTokenGenerator, getCsrfToken } from './middleware/csrfProtection.js';
import { smartRateLimit, clearRateLimitStore } from './middleware/advancedRateLimit.js';
import { comprehensiveSecurityHeaders } from './middleware/securityHeaders.js';

// Import services
import { initializeDatabase, initializeCollections } from './services/database.js';
import { initializeWebSocket } from './services/websocket.js';
import { initializeQueues, shutdownQueues } from './services/queue.js';
import { initializeCronJobs, stopCronJobs } from './services/cron.js';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Enhanced security middleware
app.use(...comprehensiveSecurityHeaders());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:8080",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Advanced rate limiting with per-user/organization limits
app.use('/api/', smartRateLimit());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization (applied to all requests)
app.use(sanitizers.userContent);

// CSRF token generation for browser-based requests
app.use(csrfTokenGenerator());

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Environment variables check endpoint (for debugging)
app.get('/env-check', (req, res) => {
  // Only allow with special header for security
  const hasDebugHeader = req.headers['x-debug-token'] === 'check-env-vars-2024';

  if (!hasDebugHeader) {
    return res.status(403).json({ error: 'Environment check requires debug token' });
  }

  const envCheck = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 'not set',

    // Database
    firebase: {
      project_id: process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
      private_key: process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing',
      client_email: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing',
      service_account_base64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? '✅ Set' : '❌ Not set (fallback to individual vars)'
    },

    // OAuth Credentials
    oauth: {
      twitter: {
        client_id: process.env.TWITTER_CLIENT_ID ? '✅ Set' : '❌ Missing',
        client_secret: process.env.TWITTER_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
        redirect_uri: process.env.TWITTER_REDIRECT_URI || '❌ Missing'
      },
      linkedin: {
        client_id: process.env.LINKEDIN_CLIENT_ID ? '✅ Set' : '❌ Missing',
        client_secret: process.env.LINKEDIN_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI || '❌ Missing'
      },
      facebook: {
        app_id: process.env.FACEBOOK_APP_ID ? '✅ Set' : '❌ Missing',
        app_secret: process.env.FACEBOOK_APP_SECRET ? '✅ Set' : '❌ Missing',
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI || '❌ Missing'
      },
      instagram: {
        client_id: process.env.INSTAGRAM_CLIENT_ID ? '✅ Set' : '❌ Missing',
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI || '❌ Missing'
      },
      oauth_base64: process.env.OAUTH_CREDENTIALS_BASE64 ? '✅ Set' : '❌ Not set (fallback to individual vars)'
    },

    // Other Services
    services: {
      jwt_secret: process.env.JWT_SECRET ? '✅ Set' : '❌ Missing',
      cors_origin: process.env.CORS_ORIGIN || '❌ Missing',
      frontend_url: process.env.FRONTEND_URL || '❌ Missing',
      sendgrid_api_key: process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing',
      cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
        api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
        api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'
      },
      redis_url: process.env.REDIS_URL ? '✅ Set' : '❌ Missing',
      openai_api_key: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'
    }
  };

  res.json(envCheck);
});

// Development endpoint to clear rate limits
if (process.env.NODE_ENV !== 'production') {
  app.post('/dev/clear-rate-limits', (req, res) => {
    clearRateLimitStore();
    res.status(200).json({
      message: 'Rate limit store cleared successfully',
      timestamp: new Date().toISOString()
    });
  });
}

// CSRF token endpoint
app.get('/api/v1/csrf-token', getCsrfToken);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/oauth', oauthRoutes);
app.use('/api/v1/invitations', invitationRoutes);
app.use('/api/v1/users', authMiddleware, userRoutes);
app.use('/api/v1/social-accounts', authMiddleware, socialAccountRoutes);
app.use('/api/v1/posts', authMiddleware, postsRoutes);
app.use('/api/v1/analytics', authMiddleware, analyticsRoutes);
app.use('/api/v1/media', authMiddleware, mediaRoutes);
// Phase 3 routes (enabled for community management)
app.use('/api/v1/communities', authMiddleware, communitiesRoutes);
app.use('/api/v1/moderation', authMiddleware, moderationRoutes);
app.use('/api/v1/ai', authMiddleware, aiRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize services
async function startServer() {
  try {
    // Initialize Firebase database connection
    await initializeDatabase();
    console.log('✅ Firebase database initialized successfully');

    // Initialize Firestore collections
    await initializeCollections();
    console.log('✅ Firestore collections initialized successfully');

    // Initialize WebSocket
    initializeWebSocket(io);
    console.log('✅ WebSocket initialized successfully');

    // Initialize Queues
    initializeQueues();
    console.log('✅ Queue system initialized successfully');

    // Initialize Cron Jobs
    initializeCronJobs();
    console.log('✅ Cron jobs initialized successfully');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  stopCronJobs();
  await shutdownQueues();
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  stopCronJobs();
  await shutdownQueues();
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start the server
startServer();

export { app, io };
