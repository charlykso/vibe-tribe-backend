// Quick OAuth test server for VibeTribe
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const app = express();
const PORT = 3005; // Different port to avoid conflicts

console.log('🚀 Starting Quick OAuth Test Server...');
console.log('📍 Port:', PORT);
console.log('🌐 CORS Origin:', process.env.CORS_ORIGIN);

// CORS configuration
app.use(cors({
  origin: ['https://vibe-tribe-manager.netlify.app', 'http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Quick OAuth Test Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Mock auth middleware (for testing)
const mockAuth = (req, res, next) => {
  req.user = {
    id: 'test_user_123',
    organization_id: 'test_org_456',
    email: 'test@example.com'
  };
  next();
};

// OAuth initiate endpoint
app.post('/api/v1/oauth/initiate', mockAuth, (req, res) => {
  const { platform } = req.body;
  console.log(`🔗 OAuth initiate request for platform: ${platform}`);
  
  let authUrl;
  const state = `${req.user.id}_${req.user.organization_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (platform === 'twitter') {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.TWITTER_REDIRECT_URI);
    const codeChallenge = 'test_challenge_' + Math.random().toString(36).substr(2, 20);
    
    authUrl = `https://twitter.com/i/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=tweet.read%20tweet.write%20users.read%20offline.access&` +
      `state=${state}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256`;
  } else if (platform === 'linkedin') {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI);
    
    authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `state=${state}&` +
      `scope=r_liteprofile%20r_emailaddress%20w_member_social`;
  }
  
  // Store state for verification (in production, use Redis or database)
  global.oauthStates = global.oauthStates || new Map();
  global.oauthStates.set(state, {
    userId: req.user.id,
    organizationId: req.user.organization_id,
    platform,
    timestamp: Date.now()
  });
  
  res.json({
    authUrl,
    state,
    platform,
    message: `Redirect user to this URL to authorize ${platform} access`
  });
});

// OAuth callback endpoint
app.post('/api/v1/oauth/callback', mockAuth, (req, res) => {
  const { platform, code, state } = req.body;
  console.log(`📞 OAuth callback for platform: ${platform}`);
  console.log(`📝 Code: ${code?.substring(0, 20)}...`);
  console.log(`🔑 State: ${state}`);
  
  // Verify state (simplified for testing)
  global.oauthStates = global.oauthStates || new Map();
  const stateData = global.oauthStates.get(state);
  
  if (!stateData) {
    return res.status(400).json({
      error: 'Invalid or expired OAuth state',
      message: 'The OAuth state parameter is invalid or has expired'
    });
  }
  
  // Clean up state
  global.oauthStates.delete(state);
  
  // Mock successful response (in production, exchange code for tokens)
  const mockAccount = {
    id: `mock_${platform}_account_${Date.now()}`,
    platform,
    platform_user_id: `mock_${platform}_user_${Math.random().toString(36).substr(2, 8)}`,
    username: `@mock_${platform}_user`,
    display_name: `Mock ${platform.charAt(0).toUpperCase() + platform.slice(1)} User`,
    avatar_url: '/api/placeholder/40/40',
    is_active: true,
    permissions: ['read', 'write'],
    metadata: {
      followers_count: Math.floor(Math.random() * 10000),
      verified: Math.random() > 0.5
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log(`✅ Mock account created for ${platform}:`, mockAccount.username);
  
  res.json({
    success: true,
    account: mockAccount,
    message: `${platform} account connected successfully (mock)`
  });
});

// Get connected accounts (mock)
app.get('/api/v1/social-accounts', mockAuth, (req, res) => {
  console.log('📋 Getting connected accounts...');
  
  // Return empty array for now (accounts would be stored in database)
  res.json({
    accounts: [],
    total: 0,
    message: 'Connected accounts retrieved successfully'
  });
});

// Get supported platforms
app.get('/api/v1/social-accounts/platforms', (req, res) => {
  console.log('🔧 Getting supported platforms...');
  
  res.json({
    platforms: [
      {
        id: 'twitter',
        name: 'Twitter',
        icon: '🐦',
        color: '#1DA1F2',
        features: ['posts', 'threads', 'analytics', 'mentions']
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: '💼',
        color: '#0077B5',
        features: ['posts', 'articles', 'analytics', 'company_pages']
      }
    ]
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

// 404 handler
app.use('*', (req, res) => {
  console.log(`❓ Unknown route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Quick OAuth Test Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
  console.log(`\n🎯 To test OAuth:`);
  console.log(`1. Update your frontend API URL to: http://localhost:${PORT}/api/v1`);
  console.log(`2. Try connecting Twitter/LinkedIn in your app`);
  console.log(`3. Check this console for OAuth flow logs`);
});

export default app;
