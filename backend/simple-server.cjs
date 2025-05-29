const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const dotenv = require('dotenv')
const path = require('path')
const { createServer } = require('http')
const { Server } = require('socket.io')

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') })

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    methods: ['GET', 'POST'],
  },
})
const PORT = process.env.PORT || 3001

// Basic middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    firebase_project: process.env.FIREBASE_PROJECT_ID || 'not configured',
    environment: process.env.NODE_ENV || 'development',
  })
})

// Mock auth endpoints
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, name',
      })
    }

    // Mock user data
    const user = {
      id: `user-${Date.now()}`,
      email,
      name,
      avatar_url:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      role: 'member',
      organization_id: 'org-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const token = `jwt-token-${user.id}-${Date.now()}`

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
      token,
    })
  } catch (error) {
    res.status(500).json({
      error: 'Registration failed',
      details: error.message,
    })
  }
})

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields: email, password',
      })
    }

    // Mock user data
    const user = {
      id: 'user-1',
      email,
      name: 'Test User',
      avatar_url:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      role: 'member',
      organization_id: 'org-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    }

    const token = `jwt-token-${user.id}-${Date.now()}`

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user,
      token,
    })
  } catch (error) {
    res.status(500).json({
      error: 'Login failed',
      details: error.message,
    })
  }
})

// Mock auth/me endpoint
app.get('/api/v1/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided',
      })
    }

    // Mock user data
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      avatar_url:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      role: 'member',
      organization_id: 'org-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get user',
      details: error.message,
    })
  }
})

// Mock posts endpoints
app.get('/api/v1/posts', async (req, res) => {
  const mockPosts = [
    {
      id: '1',
      content:
        'Excited to share our latest product update! 🚀 #innovation #tech',
      platforms: ['twitter', 'linkedin'],
      status: 'published',
      published_date: '2024-01-15T10:00:00Z',
      analytics: {
        views: 1250,
        likes: 89,
        shares: 23,
        comments: 12,
      },
      created_at: '2024-01-15T09:30:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      organization_id: 'org-1',
      user_id: 'user-1',
    },
    {
      id: '2',
      content:
        'Join us for our upcoming webinar on digital transformation strategies.',
      platforms: ['linkedin', 'facebook'],
      status: 'scheduled',
      scheduled_date: '2024-01-20T14:00:00Z',
      created_at: '2024-01-15T11:00:00Z',
      updated_at: '2024-01-15T11:00:00Z',
      organization_id: 'org-1',
      user_id: 'user-1',
    },
  ]

  res.json({
    posts: mockPosts,
    total: mockPosts.length,
  })
})

app.post('/api/v1/posts', async (req, res) => {
  try {
    const { content, platforms, scheduled_date } = req.body

    const post = {
      id: `post-${Date.now()}`,
      content,
      platforms,
      status: scheduled_date ? 'scheduled' : 'draft',
      scheduled_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organization_id: 'org-1',
      user_id: 'user-1',
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post,
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create post',
      details: error.message,
    })
  }
})

app.post('/api/v1/posts/:id/publish', async (req, res) => {
  try {
    const post = {
      id: req.params.id,
      status: 'published',
      published_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    res.json({
      success: true,
      message: 'Post published successfully',
      post,
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to publish post',
      details: error.message,
    })
  }
})

// Mock analytics endpoints
app.get('/api/v1/analytics/overview', async (req, res) => {
  try {
    const overview = {
      total_posts: 156,
      total_engagement: 12450,
      total_reach: 89300,
      engagement_rate: 4.2,
      top_platform: 'LinkedIn',
      growth_rate: 12.5,
    }

    res.json(overview)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get analytics overview',
      details: error.message,
    })
  }
})

app.get('/api/v1/analytics/platforms', async (req, res) => {
  try {
    const platforms = [
      {
        platform: 'LinkedIn',
        total_posts: 45,
        total_engagement: 5200,
        total_reach: 34500,
        engagement_rate: 5.8,
        follower_count: 12400,
        growth_rate: 15.2,
      },
      {
        platform: 'Twitter',
        total_posts: 78,
        total_engagement: 4100,
        total_reach: 28900,
        engagement_rate: 3.9,
        follower_count: 8900,
        growth_rate: 8.7,
      },
      {
        platform: 'Facebook',
        total_posts: 23,
        total_engagement: 2150,
        total_reach: 18200,
        engagement_rate: 4.5,
        follower_count: 6700,
        growth_rate: 6.3,
      },
      {
        platform: 'Instagram',
        total_posts: 10,
        total_engagement: 1000,
        total_reach: 7700,
        engagement_rate: 6.2,
        follower_count: 3200,
        growth_rate: 22.1,
      },
    ]

    res.json({ platforms })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get platform analytics',
      details: error.message,
    })
  }
})

// Mock media upload endpoint
app.post('/api/v1/media/upload', async (req, res) => {
  try {
    // Simulate file upload
    const mockFile = {
      id: `file-${Date.now()}`,
      filename: `uploaded-file-${Date.now()}.jpg`,
      original_name: 'uploaded-file.jpg',
      mime_type: 'image/jpeg',
      size: 245760,
      url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop',
      thumbnail_url:
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=200&h=150&fit=crop',
      alt_text: 'Uploaded image',
      created_at: new Date().toISOString(),
      organization_id: 'org-1',
      user_id: 'user-1',
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: mockFile,
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to upload file',
      details: error.message,
    })
  }
})

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error)
  res.status(500).json({
    error: 'Internal server error',
    details: error.message,
  })
})

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`)

  // Join organization room
  socket.on('join-room', (data) => {
    const { organizationId } = data
    socket.join(`org-${organizationId}`)
    console.log(`👥 Client ${socket.id} joined organization ${organizationId}`)

    socket.emit('connected', {
      message: 'Connected to VibeTribe backend',
      organizationId,
      timestamp: new Date().toISOString(),
    })
  })

  // Handle post status updates
  socket.on('subscribe-post-updates', () => {
    console.log(`📝 Client ${socket.id} subscribed to post updates`)
  })

  // Handle real-time notifications
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() })
  })

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`)
  })
})

// Start server
const httpServer = server.listen(PORT, () => {
  console.log('🚀 VibeTribe Backend Server Started!')
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`)
  console.log(`🔌 WebSocket URL: ws://localhost:${PORT}`)
  console.log(
    `🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID || 'Mock Mode'}`
  )
  console.log('')
  console.log('📋 Available Endpoints:')
  console.log('  POST /api/v1/auth/register - User registration')
  console.log('  POST /api/v1/auth/login - User login')
  console.log('  GET  /api/v1/auth/me - Get current user')
  console.log('  GET  /api/v1/posts - List posts')
  console.log('  POST /api/v1/posts - Create post')
  console.log('  POST /api/v1/posts/:id/publish - Publish post')
  console.log('  GET  /api/v1/analytics/overview - Analytics overview')
  console.log('  GET  /api/v1/analytics/platforms - Platform analytics')
  console.log('  POST /api/v1/media/upload - Upload media files')
  console.log('')
  console.log('✅ Ready for frontend integration!')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  httpServer.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  httpServer.close(() => {
    process.exit(0)
  })
})

module.exports = { app }
