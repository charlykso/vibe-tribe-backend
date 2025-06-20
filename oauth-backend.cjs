const express = require('express')
const cors = require('cors')

// Load environment variables from backend/.env
require('dotenv').config({ path: './backend/.env' })

const app = express()
const PORT = process.env.PORT || 3001

// Middleware with comprehensive CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)

      // List of allowed origins
      const allowedOrigins = [
        'http://localhost:8080',
        'http://localhost:8081',
        'http://localhost:8082', // Test server
        'http://localhost:3000',
        'http://localhost:5173',
        'https://vibe-tribe-manager.netlify.app', // Production frontend
        'https://vibe-tribe-backend-8yvp.onrender.com', // Production backend
        /^https:\/\/.*\.netlify\.app$/, // Any Netlify subdomain
        /^http:\/\/localhost:\d+$/, // Any localhost port
      ]

      // Check if origin is allowed
      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') {
          return allowed === origin
        } else if (allowed instanceof RegExp) {
          return allowed.test(origin)
        }
        return false
      })

      if (isAllowed) {
        callback(null, true)
      } else {
        console.log('CORS blocked origin:', origin)
        callback(null, false) // Still allow for testing, but log it
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
)
app.use(express.json())

console.log('Setting up routes...')

// Health check endpoints
app.get('/health', (req, res) => {
  console.log('Root health check requested')  res.json({
    status: 'OK',
    message: 'Tribe API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

app.get('/api/v1/health', (req, res) => {
  console.log('API health check requested')  res.json({
    status: 'ok',
    message: 'Tribe API is running',
    timestamp: new Date().toISOString(),
  })
})

// OAuth Configuration endpoint
app.get('/api/v1/oauth/config/twitter', (req, res) => {
  console.log('Twitter OAuth config requested')

  const hasCredentials =
    process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET

  res.json({
    success: true,
    configured: hasCredentials,
    client_id: hasCredentials
      ? process.env.TWITTER_CLIENT_ID
      : 'demo_twitter_client_id',
    redirect_uri:
      process.env.TWITTER_REDIRECT_URI ||
      'http://localhost:3001/api/v1/oauth/twitter/callback',
    demo_mode: !hasCredentials,
    environment: process.env.NODE_ENV || 'development',
  })
})

// OAuth Initiation endpoint
app.post('/api/v1/oauth/initiate', (req, res) => {
  console.log('OAuth initiation requested:', req.body)

  const { platform } = req.body

  if (platform !== 'twitter') {
    return res.status(400).json({
      success: false,
      error: 'Only Twitter OAuth is supported in this demo',
    })
  }

  const hasCredentials =
    process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET
  const redirectUri =
    process.env.TWITTER_REDIRECT_URI ||
    'http://localhost:3001/api/v1/oauth/twitter/callback'

  if (!hasCredentials) {
    console.log('Using demo mode for Twitter OAuth')
    // Demo mode - return a mock OAuth URL
    const mockState = `demo_state_${Date.now()}`
    const mockAuthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=demo_twitter_client_id&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${mockState}&code_challenge=demo_challenge&code_challenge_method=S256`

    return res.json({
      success: true,
      authUrl: mockAuthUrl,
      codeVerifier: 'demo_code_verifier',
      state: mockState,
      demo_mode: true,
    })
  }

  console.log('Using real Twitter credentials')
  // Real credentials mode
  const state = `twitter_state_${Date.now()}`
  const codeVerifier = `twitter_verifier_${Date.now()}`

  // In a real implementation, you would use the Twitter API SDK here
  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${
    process.env.TWITTER_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${state}&code_challenge=${codeVerifier}&code_challenge_method=S256`

  res.json({
    success: true,
    authUrl: authUrl,
    codeVerifier: codeVerifier,
    state: state,
    demo_mode: false,
  })
})

// OAuth Callback endpoint
app.post('/api/v1/oauth/callback/twitter', (req, res) => {
  console.log('Twitter OAuth callback received:', req.body)

  const { code } = req.body

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Authorization code is required',
    })
  }

  // Mock successful OAuth response
  const mockAccount = {
    platform: 'twitter',
    platform_user_id: `twitter_user_${Date.now()}`,
    username: '@demo_twitter_user',
    display_name: 'Demo Twitter User',
    avatar_url:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    access_token: `twitter_token_${Date.now()}`,
    refresh_token: `twitter_refresh_${Date.now()}`,
    permissions: ['tweet.read', 'tweet.write', 'users.read'],
    metadata: {
      followers_count: 1234,
      following_count: 567,
      tweet_count: 89,
    },
    connected_at: new Date().toISOString(),
  }

  console.log('Returning mock Twitter account:', mockAccount)

  res.json({
    success: true,
    message: 'Twitter account connected successfully',
    account: mockAccount,
  })
})

// Frontend-compatible OAuth endpoints (without /api/v1 prefix)
app.post('/oauth/initiate', (req, res) => {
  console.log('Frontend OAuth initiation requested:', req.body)

  const { platform, returnUrl } = req.body

  if (platform !== 'twitter') {
    return res.status(400).json({
      success: false,
      error: 'Only Twitter OAuth is supported in this demo',
    })
  }

  const hasCredentials =
    process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET
  const redirectUri =
    process.env.TWITTER_REDIRECT_URI ||
    'http://localhost:3001/api/v1/oauth/twitter/callback'

  if (!hasCredentials) {
    console.log('Using demo mode for Twitter OAuth')
    const mockState = `demo_state_${Date.now()}`
    const mockAuthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=demo_twitter_client_id&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${mockState}&code_challenge=demo_challenge&code_challenge_method=S256`

    return res.json({
      authUrl: mockAuthUrl,
      state: mockState,
      platform: 'twitter',
      message: 'OAuth URL generated (demo mode)',
    })
  }

  console.log('Using real Twitter credentials')
  const state = `twitter_state_${Date.now()}`
  const codeVerifier = `twitter_verifier_${Date.now()}`

  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${
    process.env.TWITTER_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${state}&code_challenge=${codeVerifier}&code_challenge_method=S256`

  res.json({
    authUrl: authUrl,
    state: state,
    platform: 'twitter',
    message: 'OAuth URL generated with real credentials',
  })
})

app.post('/oauth/callback', (req, res) => {
  console.log('Frontend OAuth callback received:', req.body)

  const { platform, code, state } = req.body

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Authorization code is required',
    })
  }

  if (platform !== 'twitter') {
    return res.status(400).json({
      success: false,
      error: 'Only Twitter OAuth is supported',
    })
  }

  // Mock successful OAuth response for frontend
  const mockAccount = {
    id: `twitter_account_${Date.now()}`,
    platform: 'twitter',
    platform_user_id: `twitter_user_${Date.now()}`,
    username: '@demo_twitter_user',
    display_name: 'Demo Twitter User',
    avatar_url:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    is_active: true,
    permissions: ['tweet.read', 'tweet.write', 'users.read'],
    metadata: {
      followers_count: 1234,
      following_count: 567,
      tweet_count: 89,
      verified: false,
    },
    created_at: new Date().toISOString(),
  }

  console.log('Returning mock Twitter account for frontend:', mockAccount)

  res.json({
    message: 'Twitter account connected successfully',
    account: mockAccount,
  })
})

// Authentication endpoints for frontend compatibility
app.post('/api/v1/auth/login', (req, res) => {
  console.log('Login request:', req.body)
  const { email, password } = req.body

  // Mock login for OAuth testing
  if (email && password) {
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: 'test-user-123',
        email: email,
        name: 'Test User',
        role: 'admin',
      },
      token: `mock_token_${Date.now()}`,
    })
  } else {
    res.status(400).json({
      success: false,
      error: 'Email and password are required',
    })
  }
})

app.post('/api/v1/auth/register', (req, res) => {
  console.log('Register request:', req.body)
  res.json({
    success: true,
    message: 'Registration successful',
    user: {
      id: 'new-user-123',
      email: req.body.email,
      name: req.body.name || 'New User',
      role: 'member',
    },
  })
})

app.get('/api/v1/auth/me', (req, res) => {
  console.log('Get current user request')
  res.json({
    success: true,
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
    },
  })
})

app.post('/api/v1/auth/logout', (req, res) => {
  console.log('Logout request')
  res.json({
    success: true,
    message: 'Logged out successfully',
  })
})

// Analytics endpoint
app.get('/api/v1/analytics/overview', (req, res) => {
  console.log('Analytics overview requested')
  res.json({
    totalMembers: 24847,
    activeMembers: 18492,
    messagesToday: 3847,
    engagementRate: 74.8,
    growth: {
      members: 12.5,
      active: 8.2,
      messages: 23.1,
      engagement: 4.3,
    },
  })
})

// Social accounts endpoints for frontend
app.get('/api/v1/social-accounts', (req, res) => {
  console.log('Get social accounts request')
  res.json({
    success: true,
    accounts: [],
  })
})

app.get('/api/v1/social-accounts/platforms/supported', (req, res) => {
  console.log('Get supported platforms request')
  res.json({
    success: true,
    platforms: [
      {
        id: 'twitter',
        name: 'Twitter',
        icon: '🐦',
        color: '#1DA1F2',
        features: ['posts', 'threads', 'analytics', 'mentions'],
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: '💼',
        color: '#0077B5',
        features: ['posts', 'articles', 'analytics', 'company_pages'],
      },
      {
        id: 'facebook',
        name: 'Facebook',
        icon: '👥',
        color: '#1877F2',
        features: ['posts', 'pages', 'analytics', 'groups'],
      },
      {
        id: 'instagram',
        name: 'Instagram',
        icon: '📸',
        color: '#E4405F',
        features: ['posts', 'stories', 'analytics', 'reels'],
      },
    ],
  })
})

// 404 handler
app.use('*', (req, res) => {
  console.log('404 - Endpoint not found:', req.originalUrl)
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  })
})

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message,
  })
})

// Start server
app.listen(PORT, () => {
  console.log(
    `🚀 Tribe Backend with OAuth running on http://localhost:${PORT}`
  )
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`)
  console.log(`🔗 CORS enabled for multiple origins including test server`)
  console.log(`🐦 Twitter OAuth endpoints available`)
})
