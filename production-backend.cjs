// Production Backend for Tribe Registration
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const admin = require('firebase-admin')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Initialize Firebase Admin (simplified)
let db = null

async function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url:
          process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
    }

    db = admin.firestore()

    // Test connection
    await db.collection('_health_check').limit(1).get()
    console.log('✅ Firebase connected successfully')

    return true
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message)
    return false
  }
}

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
  next()
})

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

const getServerTimestamp = () => {
  return admin.firestore.FieldValue.serverTimestamp()
}

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    firebase: db ? 'connected' : 'disconnected',
  })
})

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    firebase: db ? 'connected' : 'disconnected',
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

    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
      })
    }

    const { name, email, password, organizationName } = req.body

    // Validation
    if (!name || name.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name must be at least 2 characters',
      })
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      })
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      })
    }

    // Check if user already exists
    const existingUserQuery = await db
      .collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get()

    if (!existingUserQuery.empty) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user data
    const userData = {
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      role: 'member',
      organization_name: organizationName || null,
      is_active: true,
      email_verified: false,
      created_at: getServerTimestamp(),
      updated_at: getServerTimestamp(),
    }

    // Save user to Firestore
    const userRef = await db.collection('users').add(userData)
    const userId = userRef.id

    // Generate JWT token
    const token = generateToken(userId)

    console.log('✅ User registered successfully:', {
      id: userId,
      email: email.toLowerCase(),
      name,
    })

    // Return user data (without password)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        email: email.toLowerCase(),
        name,
        role: 'member',
        organization_id: organizationName || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
      })
    }

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      })
    }

    // Get user by email
    const userQuery = await db
      .collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get()

    if (userQuery.empty) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      })
    }

    const userDoc = userQuery.docs[0]
    const user = { id: userDoc.id, ...userDoc.data() }

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
    await db.collection('users').doc(user.id).update({
      last_login: getServerTimestamp(),
      updated_at: getServerTimestamp(),
    })

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
        created_at:
          user.created_at?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

// Get current user endpoint
app.get('/api/v1/auth/me', async (req, res) => {
  try {
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

      if (!db) {
        return res.status(503).json({
          success: false,
          error: 'Database not available',
        })
      }

      const userDoc = await db.collection('users').doc(decoded.sub).get()

      if (!userDoc.exists) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        })
      }

      const user = { id: userDoc.id, ...userDoc.data() }

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated',
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
          created_at:
            user.created_at?.toDate?.()?.toISOString() ||
            new Date().toISOString(),
          updated_at:
            user.updated_at?.toDate?.()?.toISOString() ||
            new Date().toISOString(),
        },
      })
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      })
    }
  } catch (error) {
    console.error('❌ Get user error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
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
async function startServer() {
  console.log('🚀 Starting Tribe Production Backend...')

  // Initialize Firebase
  const firebaseConnected = await initializeFirebase()

  if (!firebaseConnected) {
    console.log('⚠️ Starting without Firebase - some features will be limited')
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Tribe Backend running on http://localhost:${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
    console.log(`🔗 API Health: http://localhost:${PORT}/api/v1/health`)
    console.log(
      `📝 Registration: POST http://localhost:${PORT}/api/v1/auth/register`
    )
    console.log(`🔐 Login: POST http://localhost:${PORT}/api/v1/auth/login`)
    console.log(`👤 Current User: GET http://localhost:${PORT}/api/v1/auth/me`)
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(
      `🔥 Firebase: ${firebaseConnected ? 'Connected' : 'Disconnected'}`
    )

    if (firebaseConnected) {
      console.log(`\n📋 Test registration with:`)
      console.log(
        `curl -X POST http://localhost:${PORT}/api/v1/auth/register \\`
      )
      console.log(`  -H "Content-Type: application/json" \\`)
      console.log(
        `  -d '{"name":"Test User","email":"test@example.com","password":"TestPassword123","organizationName":"Test Org"}'`
      )
    }
  })

  // Handle server errors
  server.on('error', (err) => {
    console.error('❌ Server error:', err)
  })
}

// Handle process errors
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err)
})

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err)
})

// Start the server
startServer()
