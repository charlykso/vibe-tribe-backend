import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, initializeCollections } from './services/database.js';

// Load environment variables
dotenv.config();

console.log('🔧 Starting Tribe Backend (Development Mode)...');
console.log('📁 Environment loaded');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('📦 Setting up middleware...');

// Basic middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://vibe-tribe-frontend.vercel.app'] 
    : ['http://localhost:8080', 'http://localhost:3000'],
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
    message: 'Tribe Backend is running (Development Mode)',
    version: '1.0.0'
  });
});

console.log('✅ Health endpoint configured');

// Basic API endpoints
app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      auth: 'enabled',
      oauth: 'placeholder (requires additional setup)',
      posts: 'placeholder (requires additional setup)',
      analytics: 'placeholder (requires additional setup)',
      ai: 'placeholder (requires additional setup)',
      database: 'enabled',
      websocket: 'disabled',
      cron: 'disabled'
    }
  });
});

// Auth endpoints are now handled above

console.log('✅ Status endpoint configured');

// Try importing routes one by one
console.log('📦 Loading routes...');

// Import auth routes
console.log('📦 Loading auth routes...');
import authRoutes from './routes/auth.js';

// Add auth routes
app.use('/api/v1/auth', authRoutes);
console.log('✅ Auth routes loaded');

// Add community routes
import communityRoutes from './routes/communities.js';
app.use('/api/v1/communities', communityRoutes);
console.log('✅ Community routes loaded');

// Add invitation routes
import invitationRoutes from './routes/invitations.js';
app.use('/api/v1/invitations', invitationRoutes);
console.log('✅ Invitation routes loaded');

// OAuth routes require database - add placeholder endpoints
console.log('⚠️ OAuth routes skipped (require database initialization)');

// Add placeholder OAuth endpoints
app.get('/api/v1/oauth/status', (req, res) => {
  res.json({
    message: 'OAuth functionality requires database initialization',
    status: 'disabled',
    note: 'Enable database to connect social media accounts'
  });
});

app.get('/api/v1/oauth/twitter/connect', (req, res) => {
  res.json({
    message: 'Twitter OAuth requires database initialization',
    status: 'disabled',
    note: 'Enable database to connect Twitter accounts'
  });
});

// Posts routes require database - add placeholder endpoints
console.log('⚠️ Posts routes skipped (require database initialization)');

// Add placeholder posts endpoints
app.get('/api/v1/posts', (req, res) => {
  res.json({
    message: 'Posts feature requires database initialization',
    status: 'disabled',
    note: 'Enable database to access full posts functionality'
  });
});

app.post('/api/v1/posts', (req, res) => {
  res.json({
    message: 'Posts creation requires database initialization',
    status: 'disabled',
    note: 'Enable database to create posts'
  });
});

// Analytics routes require database - add placeholder endpoints
console.log('⚠️ Analytics routes skipped (require database initialization)');

// Add placeholder analytics endpoints
app.get('/api/v1/analytics', (req, res) => {
  res.json({
    message: 'Analytics feature requires database initialization',
    status: 'disabled',
    note: 'Enable database to access analytics functionality'
  });
});

app.get('/api/v1/analytics/overview', (req, res) => {
  res.json({
    message: 'Analytics overview requires database initialization',
    status: 'disabled',
    note: 'Enable database to view analytics'
  });
});

// AI routes require database - skip for now
console.log('⚠️ AI routes skipped (require database initialization)');

// Add a placeholder AI status endpoint
app.get('/api/v1/ai/status', (req, res) => {
  res.json({
    message: 'AI features available but require database initialization',
    status: 'disabled',
    note: 'Enable database to access full AI functionality'
  });
});

// Add test endpoint for communities (no auth required)
app.get('/api/v1/test/communities', async (req, res) => {
  try {
    console.log('🔍 Test communities endpoint accessed');
    const { getFirestoreClient } = await import('./services/database.js');
    const firestore = getFirestoreClient();

    // Get all communities
    const snapshot = await firestore.collection('communities').get();
    const communities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('✅ Test communities fetched:', communities.length);

    res.json({
      success: true,
      data: communities,
      count: communities.length
    });
  } catch (error) {
    console.error('❌ Test communities error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

console.log('✅ Error handlers configured');

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

    // Start server on IPv4 localhost
    app.listen(Number(PORT), '127.0.0.1', () => {
      console.log(`🚀 Tribe Backend running on port ${PORT} (Development Mode)`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API status: http://localhost:${PORT}/api/v1/status`);
      console.log(`🔗 Auth login: http://localhost:${PORT}/api/v1/auth/login`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  process.exit(0);
});

console.log('✅ Development server setup complete');
