import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initializeDatabase, initializeCollections } from './dist/services/database.js';
import { initializeWebSocket } from './dist/services/websocket.js';

// Load environment variables
dotenv.config();

console.log('🔧 Starting Tribe Backend (Working Development Server)...');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

console.log('✅ Middleware configured');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Tribe Backend is running (Working Development Mode)',
    version: '1.0.0'
  });
});

// Status endpoint
app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      auth: 'enabled',
      database: 'enabled',
      websocket: 'enabled',
      cron: 'disabled'
    }
  });
});

// Import and use routes
import authRoutes from './dist/routes/auth.js';
import usersRoutes from './dist/routes/users.js';
import communitiesRoutes from './dist/routes/communities.js';
import invitationsRoutes from './dist/routes/invitations.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/communities', communitiesRoutes);
app.use('/api/v1/invitations', invitationsRoutes);

console.log('✅ All routes configured');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Initialize services and start server
async function startServer() {
  try {
    console.log('🚀 Starting server...');
    
    // Initialize Firebase database connection
    await initializeDatabase();
    console.log('✅ Firebase database initialized successfully');

    // Initialize Firestore collections
    await initializeCollections();
    console.log('✅ Firestore collections initialized successfully');

    // Create HTTP server and initialize Socket.IO
    const httpServer = createServer(app);

    // Initialize Socket.IO with CORS configuration
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Initialize WebSocket service
    try {
      // Check if JWT_SECRET is available
      if (!process.env.JWT_SECRET) {
        console.warn('⚠️ JWT_SECRET not configured, WebSocket authentication disabled');
      }

      initializeWebSocket(io);
      console.log('✅ WebSocket service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket service:', error);
      console.error('Error details:', error.message);
      console.log('⚠️ Continuing without WebSocket support');

      // Set up a basic Socket.IO server without authentication
      io.on('connection', (socket) => {
        console.log('📡 Basic WebSocket connection established (no auth)');
        socket.emit('connection_status', { connected: true, authenticated: false });
      });
    }

    // Start server on IPv4 localhost
    const server = httpServer.listen(Number(PORT), '127.0.0.1', () => {
      console.log(`🚀 Tribe Backend running on port ${PORT} (Working Development Mode)`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API status: http://localhost:${PORT}/api/v1/status`);
      console.log(`🔗 Auth login: POST http://localhost:${PORT}/api/v1/auth/login`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });

    server.on('listening', () => {
      console.log('✅ Server is listening on port', server.address());
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();
