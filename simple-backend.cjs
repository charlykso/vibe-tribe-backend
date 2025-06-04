const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001

// Token blacklist to track logged out tokens
const tokenBlacklist = new Set()

// Middleware
app.use(
  cors({
    origin: ['http://localhost:8080', 'http://localhost:8081'],
    credentials: true,
  })
)
app.use(express.json())

// Mock data
const mockUser = {
  id: 'user_123',
  email: 'user@example.com',
  displayName: 'John Doe',
  avatar_url:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  created_at: new Date().toISOString(),
}

const mockPosts = [
  {
    id: 'post_1',
    content: 'Just launched our new social media management platform! 🚀',
    platforms: ['twitter', 'linkedin'],
    status: 'published',
    scheduled_for: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    analytics: { views: 1250, likes: 45, shares: 12 },
  },
  {
    id: 'post_2',
    content:
      'Working on some exciting new features for VibeTribe! Stay tuned 👀',
    platforms: ['twitter', 'facebook'],
    status: 'scheduled',
    scheduled_for: new Date(Date.now() + 3600000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    analytics: { views: 0, likes: 0, shares: 0 },
  },
]

const mockAnalytics = {
  overview: {
    total_posts: 25,
    total_views: 15420,
    total_likes: 892,
    total_shares: 156,
    engagement_rate: 6.8,
  },
  platforms: {
    twitter: { posts: 12, views: 8500, likes: 450, shares: 89 },
    linkedin: { posts: 8, views: 4200, likes: 320, shares: 45 },
    facebook: { posts: 5, views: 2720, likes: 122, shares: 22 },
  },
  recent_activity: [
    { date: '2024-01-15', views: 450, likes: 23, shares: 5 },
    { date: '2024-01-14', views: 380, likes: 19, shares: 3 },
    { date: '2024-01-13', views: 520, likes: 31, shares: 8 },
  ],
}

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', message: 'Simple backend is running' })
})

// Auth endpoints - Real authentication logic
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required',
    })
  }

  // Simple demo users for testing (replace with real database lookup)
  const demoUsers = [
    {
      email: 'admin@vibetrybe.com',
      password: 'admin123',
      role: 'admin',
      name: 'Admin User',
    },
    {
      email: 'user@vibetrybe.com',
      password: 'user123',
      role: 'member',
      name: 'Demo User',
    },
    {
      email: 'test@example.com',
      password: 'password123',
      role: 'member',
      name: 'Test User',
    },
    {
      email: 'charlykso121@gmail.com',
      password: 'NEXsolve869#$',
      role: 'admin',
      name: 'Charles Kso',
    },
  ]

  // Find user by email and password
  const user = demoUsers.find(
    (u) => u.email === email && u.password === password
  )

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    })
  }

  // Generate a simple JWT-like token
  const token = `jwt-${Buffer.from(
    JSON.stringify({
      email: user.email,
      role: user.role,
      exp: Date.now() + 86400000,
    })
  ).toString('base64')}`

  // Return user data (excluding password)
  const userData = {
    id: `user_${Date.now()}`,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar_url:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  res.json({
    success: true,
    user: userData,
    token: token,
  })
})

app.post('/api/v1/auth/register', (req, res) => {
  const { email, password, name } = req.body

  // Basic validation
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: 'Email, password, and name are required',
    })
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid email address',
    })
  }

  // Password strength validation
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long',
    })
  }

  // Check if user already exists (in real app, check database)
  const existingUsers = ['admin@vibetrybe.com', 'user@vibetrybe.com']
  if (existingUsers.includes(email)) {
    return res.status(409).json({
      success: false,
      error: 'User with this email already exists',
    })
  }

  // Generate a simple JWT-like token
  const token = `jwt-${Buffer.from(
    JSON.stringify({
      email: email,
      role: 'member',
      exp: Date.now() + 86400000,
    })
  ).toString('base64')}`

  // Create new user data
  const userData = {
    id: `user_${Date.now()}`,
    email: email,
    name: name,
    role: 'member',
    avatar_url:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  res.status(201).json({
    success: true,
    user: userData,
    token: token,
  })
})

app.post('/api/v1/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    tokenBlacklist.add(token)
  }

  res.json({
    success: true,
    message: 'Logout successful',
  })
})

app.get('/api/v1/auth/me', (req, res) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization token required',
    })
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  // Check if token is blacklisted (logged out)
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({
      success: false,
      error: 'Token has been invalidated',
    })
  }

  try {
    // Validate token format
    if (!token.startsWith('jwt-')) {
      throw new Error('Invalid token format')
    }

    // Decode token payload
    const payload = JSON.parse(
      Buffer.from(token.substring(4), 'base64').toString()
    )

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now()) {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
      })
    }

    // Return user data based on token
    const userData = {
      id: `user_${Date.now()}`,
      email: payload.email,
      name:
        payload.email === 'admin@vibetrybe.com' ? 'Admin User' : 'Demo User',
      role: payload.role,
      avatar_url:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    res.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    })
  }
})

// Posts endpoints
app.get('/api/v1/posts', (req, res) => {
  res.json({
    success: true,
    posts: mockPosts,
    total: mockPosts.length,
  })
})

app.post('/api/v1/posts', (req, res) => {
  const newPost = {
    id: `post_${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString(),
    analytics: { views: 0, likes: 0, shares: 0 },
  }
  mockPosts.unshift(newPost)
  res.json({
    success: true,
    post: newPost,
  })
})

// Analytics endpoints
app.get('/api/v1/analytics/overview', (req, res) => {
  res.json({
    success: true,
    data: mockAnalytics.overview,
  })
})

app.get('/api/v1/analytics/platforms', (req, res) => {
  res.json({
    success: true,
    data: mockAnalytics.platforms,
  })
})

app.get('/api/v1/analytics/activity', (req, res) => {
  res.json({
    success: true,
    data: mockAnalytics.recent_activity,
  })
})

// Activity endpoints (missing)
app.get('/api/v1/activity/recent', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'activity_1',
        type: 'post_published',
        message: 'Post published to Twitter and LinkedIn',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        platforms: ['twitter', 'linkedin'],
      },
      {
        id: 'activity_2',
        type: 'post_scheduled',
        message: 'Post scheduled for tomorrow',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        platforms: ['facebook'],
      },
      {
        id: 'activity_3',
        type: 'account_connected',
        message: 'LinkedIn account connected successfully',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        platforms: ['linkedin'],
      },
    ],
  })
})

// Community endpoints (missing)
app.get('/api/v1/community/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      total_followers: 2450,
      total_following: 890,
      engagement_rate: 6.8,
      growth_rate: 12.5,
      top_platforms: [
        { platform: 'twitter', followers: 1200, growth: 8.2 },
        { platform: 'linkedin', followers: 850, growth: 15.3 },
        { platform: 'facebook', followers: 400, growth: 5.1 },
      ],
      recent_mentions: [
        {
          id: 'mention_1',
          platform: 'twitter',
          user: '@johndoe',
          content: 'Great insights on social media management!',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: 'mention_2',
          platform: 'linkedin',
          user: 'Jane Smith',
          content: 'Thanks for sharing this valuable content.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    },
  })
})

// Social accounts endpoints
app.get('/api/v1/social-accounts', (req, res) => {
  res.json({
    success: true,
    accounts: [
      {
        id: 'acc_1',
        platform: 'twitter',
        username: '@johndoe',
        connected: true,
        avatar_url:
          'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
      },
      {
        id: 'acc_2',
        platform: 'linkedin',
        username: 'John Doe',
        connected: true,
        avatar_url:
          'https://media.licdn.com/dms/image/C4E03AQHqUuBkW8qGBQ/profile-displayphoto-shrink_100_100/0/1234567890123?e=1234567890&v=beta&t=abcdef',
      },
      {
        id: 'acc_3',
        platform: 'facebook',
        username: 'John Doe',
        connected: false,
        avatar_url: null,
      },
    ],
  })
})

// Drafts endpoints
app.get('/api/v1/drafts', (req, res) => {
  res.json({
    success: true,
    drafts: [
      {
        id: 'draft_1',
        content: 'This is a draft post about our upcoming product launch...',
        platforms: ['twitter', 'linkedin'],
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  })
})

// Media upload endpoint
app.post('/api/v1/media/upload', (req, res) => {
  res.json({
    success: true,
    media: {
      id: `media_${Date.now()}`,
      url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop',
      type: 'image',
      size: 1024000,
      filename: 'uploaded_image.jpg',
    },
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  })
})

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 VibeTribe Backend server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`)
  console.log(
    `🔗 CORS enabled for: http://localhost:8080, http://localhost:8081`
  )
  console.log(`📝 Available demo users:`)
  console.log(`   - admin@vibetrybe.com / admin123 (admin)`)
  console.log(`   - user@vibetrybe.com / user123 (member)`)
  console.log(`   - test@example.com / password123 (member)`)
  console.log(`   - charlykso121@gmail.com / NEXsolve869#$ (admin)`)
})

// Handle port conflicts
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`)
    console.error(
      `💡 Please stop any other services running on port ${PORT} or set a different PORT environment variable.`
    )
    console.error(
      `🔧 To kill processes on port ${PORT}, run: npx kill-port ${PORT}`
    )
    process.exit(1)
  } else {
    console.error('❌ Server error:', err)
    process.exit(1)
  }
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down VibeTribe Backend server...')
  server.close(() => {
    console.log('✅ Server closed successfully')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
  server.close(() => {
    console.log('✅ Server closed successfully')
    process.exit(0)
  })
})
