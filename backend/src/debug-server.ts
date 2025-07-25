import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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
      auth: 'placeholder (requires database)',
      oauth: 'placeholder (requires database)',
      posts: 'placeholder (requires database)',
      analytics: 'placeholder (requires database)',
      ai: 'placeholder (requires database)',
      database: 'disabled',
      websocket: 'disabled',
      cron: 'disabled'
    }
  });
});

// Auth endpoints are now handled above

console.log('✅ Status endpoint configured');

// Try importing routes one by one
console.log('📦 Loading routes...');

// Auth routes require database - add placeholder endpoints
console.log('⚠️ Auth routes skipped (require database initialization)');

// Add placeholder auth endpoints
app.post('/api/v1/auth/login', (req, res) => {
  res.json({
    message: 'Login requires database initialization',
    status: 'disabled',
    note: 'Enable database to authenticate users'
  });
});

app.post('/api/v1/auth/register', (req, res) => {
  res.json({
    message: 'Registration requires database initialization',
    status: 'disabled',
    note: 'Enable database to register new users'
  });
});

app.get('/api/v1/auth/test', (req, res) => {
  res.json({
    message: 'Auth routes are available but require database',
    status: 'disabled',
    note: 'Enable database for full authentication functionality'
  });
});

app.get('/api/v1/auth/*', (req, res) => {
  res.json({
    message: 'Auth functionality requires database initialization',
    status: 'disabled',
    note: 'Enable database for authentication features'
  });
});

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

// Start server
console.log('🚀 Starting server...');

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Tribe Backend running on port ${PORT} (Development Mode)`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API status: http://localhost:${PORT}/api/v1/status`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

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
