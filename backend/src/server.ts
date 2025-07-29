import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Load environment variables
dotenv.config();

console.log('🔧 Starting Tribe Backend...');
console.log('📁 Environment loaded');

console.log('📦 Loading routes...');

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
// import communityRoutes from './routes/community.js'; // Temporarily disabled for deployment
// import activityRoutes from './routes/activity.js'; // Temporarily disabled for deployment
// import moderationRoutes from './routes/moderation.js'; // Temporarily disabled
// import aiRoutes from './routes/ai.js'; // Temporarily disabled for debugging

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
// import { initializeQueues, shutdownQueues } from './services/queue.js'; // Temporarily disabled
// import { initializeCronJobs, stopCronJobs } from './services/cron.js'; // Temporarily disabled

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced security middleware
app.use(...comprehensiveSecurityHeaders());

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      "http://localhost:8080",
      "https://vibe-tribe-manager.netlify.app"
    ];

const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: corsOrigins,
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

// Environment variables check endpoint (for debugging) - temporarily disabled due to TypeScript issues
// app.get('/env-check', (req, res) => {
//   // Only allow with special header for security
//   const hasDebugHeader = req.headers['x-debug-token'] === 'check-env-vars-2024';
//   if (!hasDebugHeader) {
//     return res.status(403).json({ error: 'Environment check requires debug token' });
//   }
//   res.json({ message: 'Environment check endpoint temporarily disabled' });
// });

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
// Phase 3 routes
app.use('/api/v1/communities', authMiddleware, communitiesRoutes);
// app.use('/api/v1/community', authMiddleware, communityRoutes); // Temporarily disabled for deployment
// app.use('/api/v1/activity', authMiddleware, activityRoutes); // Temporarily disabled for deployment
// app.use('/api/v1/moderation', authMiddleware, moderationRoutes); // Temporarily disabled
// app.use('/api/v1/ai', authMiddleware, aiRoutes); // Temporarily disabled for debugging

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
    console.log('🚀 Starting server...');

    // Initialize Firebase database connection
    await initializeDatabase();
    console.log('✅ Firebase database initialized successfully');

    // Initialize Firestore collections
    await initializeCollections();
    console.log('✅ Firestore collections initialized successfully');

    // Initialize WebSocket
    try {
      initializeWebSocket(io);
      console.log('✅ WebSocket initialized successfully');
    } catch (error) {
      console.error('❌ WebSocket initialization failed:', error);
      console.log('⚠️ Continuing without WebSocket...');
    }

    console.log('⚠️ Queues and Cron jobs disabled for debugging');

    // Start server - bind to 0.0.0.0 for production, 127.0.0.1 for development
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
    server.listen(Number(PORT), host, () => {
      console.log(`🚀 Server running on ${host}:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  // stopCronJobs(); // Disabled
  // await shutdownQueues(); // Disabled
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  // stopCronJobs(); // Disabled
  // await shutdownQueues(); // Disabled
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start the server
startServer();

export { app, io };
