import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3002;

console.log('🔧 Starting simple server...');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');
console.log('🌐 CORS Origin:', process.env.CORS_ORIGIN || 'https://vibe-tribe-manager.netlify.app');

// Basic middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://vibe-tribe-manager.netlify.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors_origin: process.env.CORS_ORIGIN
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// Mock OAuth endpoints for testing
app.post('/api/v1/oauth/initiate', (req, res) => {
  const { platform } = req.body;
  console.log(`🔗 OAuth initiate request for platform: ${platform}`);
  
  // Return a mock auth URL for testing
  res.json({
    authUrl: `https://api.twitter.com/2/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.TWITTER_REDIRECT_URI)}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=test_state_123&code_challenge=test_challenge&code_challenge_method=S256`,
    state: 'test_state_123',
    platform,
    message: `Redirect user to this URL to authorize ${platform} access`
  });
});

app.post('/api/v1/oauth/callback', (req, res) => {
  const { platform, code, state } = req.body;
  console.log(`📞 OAuth callback for platform: ${platform}, code: ${code}, state: ${state}`);
  
  // Mock successful response
  res.json({
    success: true,
    account: {
      id: 'mock_account_123',
      platform,
      platform_user_id: `mock_${platform}_user_456`,
      username: `@mock_${platform}_user`,
      display_name: `Mock ${platform} User`,
      avatar_url: '/api/placeholder/40/40',
      is_active: true,
      permissions: ['read', 'write'],
      metadata: {
        followers_count: 1000,
        verified: false
      }
    },
    message: `${platform} account connected successfully`
  });
});

// Catch all for API routes
app.use('/api/*', (req, res) => {
  console.log(`❓ Unknown API route: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
  console.log(`🌐 CORS configured for: ${process.env.CORS_ORIGIN}`);
});

export { app };
