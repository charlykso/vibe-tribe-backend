const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Mock user data
const mockUser = {
  id: '1',
  email: 'admin@vibetrbe.com',
  displayName: 'Admin User',
  role: 'admin',
}

// Mock analytics data
const mockAnalytics = {
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
}

// Mock posts data
const mockPosts = [
  {
    id: '1',
    content: 'Welcome to our community!',
    platform: 'twitter',
    status: 'published',
    createdAt: new Date().toISOString(),
    metrics: { likes: 45, shares: 12, comments: 8 },
  },
  {
    id: '2',
    content: 'Check out our latest features',
    platform: 'linkedin',
    status: 'scheduled',
    scheduledFor: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
]

// Routes
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', message: 'VibeTribe API is running' })
})

// Auth endpoints
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body

  // Mock login - accept any email/password
  if (email && password) {
    const token = 'mock-jwt-token-' + Date.now()
    res.json({
      user: { ...mockUser, email },
      token,
    })
  } else {
    res.status(400).json({ error: 'Email and password required' })
  }
})

app.post('/api/v1/auth/register', (req, res) => {
  const { email, password, name } = req.body

  // Mock registration - accept any data
  if (email && password && name) {
    const token = 'mock-jwt-token-' + Date.now()
    res.json({
      user: { ...mockUser, email, name, displayName: name },
      token,
    })
  } else {
    res.status(400).json({ error: 'Email, password, and name required' })
  }
})

app.get('/api/v1/auth/me', (req, res) => {
  // Mock authentication check - always return user
  res.json({ user: mockUser })
})

app.post('/api/v1/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

app.post('/api/v1/auth/forgot-password', (req, res) => {
  res.json({ message: 'Password reset email sent' })
})

app.get('/api/v1/analytics/overview', (req, res) => {
  res.json(mockAnalytics)
})

app.get('/api/v1/posts', (req, res) => {
  res.json({ posts: mockPosts, total: mockPosts.length })
})

app.get('/api/v1/posts/:id', (req, res) => {
  const post = mockPosts.find((p) => p.id === req.params.id)
  if (!post) {
    return res.status(404).json({ error: 'Post not found' })
  }
  res.json(post)
})

app.post('/api/v1/posts', (req, res) => {
  const newPost = {
    id: String(mockPosts.length + 1),
    ...req.body,
    createdAt: new Date().toISOString(),
    status: 'draft',
  }
  mockPosts.push(newPost)
  res.status(201).json(newPost)
})

app.get('/api/v1/platforms', (req, res) => {
  res.json({
    platforms: [
      { id: 'twitter', name: 'Twitter', connected: true, status: 'active' },
      { id: 'linkedin', name: 'LinkedIn', connected: true, status: 'active' },
      {
        id: 'facebook',
        name: 'Facebook',
        connected: false,
        status: 'inactive',
      },
      { id: 'instagram', name: 'Instagram', connected: true, status: 'active' },
    ],
  })
})

app.get('/api/v1/community/stats', (req, res) => {
  res.json({
    totalMembers: 24847,
    activeMembers: 18492,
    newMembersToday: 127,
    engagementRate: 74.8,
    communities: [
      {
        name: 'Discord Community',
        members: 15420,
        status: 'healthy',
        change: 5.2,
      },
      {
        name: 'Telegram Group',
        members: 8947,
        status: 'growing',
        change: 12.8,
      },
      {
        name: 'Slack Workspace',
        members: 2340,
        status: 'stable',
        change: -2.1,
      },
    ],
  })
})

app.get('/api/v1/activity/recent', (req, res) => {
  res.json({
    activities: [
      {
        id: 1,
        type: 'member_joined',
        title: 'John Smith joined the community',
        time: '2 minutes ago',
        icon: 'Users',
      },
      {
        id: 2,
        type: 'engagement',
        title: 'Post about product updates got 150+ reactions',
        time: '15 minutes ago',
        icon: 'Heart',
      },
      {
        id: 3,
        type: 'moderation',
        title: 'Spam message auto-removed in #general',
        time: '32 minutes ago',
        icon: 'AlertTriangle',
      },
      {
        id: 4,
        type: 'milestone',
        title: 'Community reached 25K members!',
        time: '1 hour ago',
        icon: 'CheckCircle',
      },
    ],
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 VibeTribe Test Backend running on http://localhost:${PORT}`)
  console.log(`📊 API Health: http://localhost:${PORT}/api/v1/health`)
  console.log(`👤 Mock User: http://localhost:${PORT}/api/v1/auth/me`)
  console.log(
    `📈 Analytics: http://localhost:${PORT}/api/v1/analytics/overview`
  )
})
