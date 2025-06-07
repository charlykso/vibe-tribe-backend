// Stable Backend for Registration Testing
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(
  cors({
    origin: ['http://localhost:8080', 'http://localhost:8081'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2))
  }
  next()
})

// Mock user storage (in production this would be Firebase)
let users = [
  {
    id: '1',
    email: 'admin@vibetrybe.com',
    name: 'Admin User',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', // admin123
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'user@vibetrybe.com',
    name: 'Regular User',
    password: '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // user123
    role: 'member',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Validation schemas (simplified)
const validateRegistration = (data) => {
  const errors = []

  if (!data.name || data.name.length < 2) {
    errors.push({
      field: 'name',
      message: 'Name must be at least 2 characters',
    })
  }

  if (!data.email || !data.email.includes('@')) {
    errors.push({ field: 'email', message: 'Invalid email format' })
  }

  if (!data.password || data.password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters',
    })
  }

  return errors
}

// Helper functions
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12)
}

const generateToken = (userId) => {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET || 'demo-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Stable backend is running',
  })
})

// API Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    message: 'API is healthy',
  })
})

// Registration endpoint
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    console.log('📝 Registration request received:', {
      name: req.body.name,
      email: req.body.email,
      organizationName: req.body.organizationName,
    })

    const { name, email, password, organizationName } = req.body

    // Validate input
    const validationErrors = validateRegistration({ name, email, password })
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
      })
    }

    // Check if user already exists
    const existingUser = users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    )
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      role: 'member',
      organization_name: organizationName || null,
      is_active: true,
      email_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    users.push(newUser)

    // Generate JWT token
    const token = generateToken(newUser.id)

    console.log('✅ User registered successfully:', {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    })

    // Return user data (without password)
    const { password: _, ...userResponse } = newUser

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userResponse.id,
        email: userResponse.email,
        name: userResponse.name,
        role: userResponse.role,
        organization_id: userResponse.organization_name,
        created_at: userResponse.created_at,
        updated_at: userResponse.updated_at,
      },
      token,
    })
  } catch (error) {
    console.error('❌ Registration error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    })
  }
})

// Login endpoint
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login request received:', { email: req.body.email })

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      })
    }

    // Find user by email
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    )

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      })
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      })
    }

    // Update last login
    user.last_login = new Date().toISOString()
    user.updated_at = new Date().toISOString()

    // Generate JWT token
    const token = generateToken(user.id)

    console.log('✅ User logged in successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
    })

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization_id: user.organization_name,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      token,
    })
  } catch (error) {
    console.error('❌ Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    })
  }
})

// Get current user (protected route)
app.get('/api/v1/auth/me', (req, res) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
    })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'demo-secret-key'
    )
    const user = users.find((u) => u.id === decoded.sub)

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token or user not found',
      })
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization_id: user.organization_name,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    })
  }
})

// List all users (for testing)
app.get('/api/v1/users', (req, res) => {
  res.json({
    success: true,
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
    })),
  })
})

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Stable VibeTribe Backend running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 API Health: http://localhost:${PORT}/api/v1/health`)
  console.log(
    `📝 Registration: POST http://localhost:${PORT}/api/v1/auth/register`
  )
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/v1/auth/login`)
  console.log(`👤 Current User: GET http://localhost:${PORT}/api/v1/auth/me`)
  console.log(`👥 Users List: GET http://localhost:${PORT}/api/v1/users`)
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`\n📋 Test registration with:`)
  console.log(`curl -X POST http://localhost:${PORT}/api/v1/auth/register \\`)
  console.log(`  -H "Content-Type: application/json" \\`)
  console.log(
    `  -d '{"name":"Test User","email":"test@example.com","password":"TestPassword123","organizationName":"Test Org"}'`
  )
  console.log(`\n📋 Test login with:`)
  console.log(`curl -X POST http://localhost:${PORT}/api/v1/auth/login \\`)
  console.log(`  -H "Content-Type: application/json" \\`)
  console.log(`  -d '{"email":"admin@vibetrybe.com","password":"admin123"}'`)
})
