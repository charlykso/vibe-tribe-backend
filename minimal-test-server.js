import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Minimal test server is running',
    firebase_project: process.env.FIREBASE_PROJECT_ID || 'not configured'
  });
});

// Test Firebase connection
app.get('/test-firebase', async (req, res) => {
  try {
    // Dynamic import to avoid module loading issues
    const { initializeDatabase, getFirestoreClient } = await import('./backend/src/services/database.js');
    
    await initializeDatabase();
    const firestore = getFirestoreClient();
    
    // Simple test - try to read from a collection
    const testCollection = firestore.collection('_test');
    const snapshot = await testCollection.limit(1).get();
    
    res.json({
      success: true,
      message: 'Firebase connection successful',
      collections_accessible: true,
      test_collection_size: snapshot.size
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Firebase connection failed',
      error: error.message
    });
  }
});

// Test auth endpoints
app.post('/test-auth-register', async (req, res) => {
  try {
    const { initializeDatabase, getFirestoreClient, getServerTimestamp } = await import('./backend/src/services/database.js');
    
    await initializeDatabase();
    const firestore = getFirestoreClient();
    
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }
    
    // Check if user already exists
    const usersCollection = firestore.collection('users');
    const existingUser = await usersCollection.where('email', '==', email).limit(1).get();
    
    if (!existingUser.empty) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // Create new user (simplified - no password hashing for test)
    const userRef = usersCollection.doc();
    await userRef.set({
      email,
      name,
      password, // In real app, this should be hashed
      created_at: getServerTimestamp(),
      updated_at: getServerTimestamp(),
      is_active: true
    });
    
    res.json({
      success: true,
      message: 'User registered successfully',
      user_id: userRef.id
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Test social accounts endpoint
app.get('/test-social-accounts', async (req, res) => {
  try {
    const { initializeDatabase, getFirestoreClient } = await import('./backend/src/services/database.js');
    
    await initializeDatabase();
    const firestore = getFirestoreClient();
    
    // Try to read from social_accounts collection
    const socialAccountsCollection = firestore.collection('social_accounts');
    const snapshot = await socialAccountsCollection.limit(5).get();
    
    const accounts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      message: 'Social accounts endpoint working',
      accounts_count: snapshot.size,
      accounts: accounts
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Social accounts test failed',
      error: error.message
    });
  }
});

// Test platforms endpoint
app.get('/test-platforms', (req, res) => {
  const platforms = [
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
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '👥',
      color: '#1877F2',
      features: ['posts', 'pages', 'analytics', 'groups']
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📸',
      color: '#E4405F',
      features: ['posts', 'stories', 'analytics', 'reels']
    }
  ];

  res.json({
    success: true,
    platforms
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    available_endpoints: [
      'GET /health',
      'GET /test-firebase',
      'POST /test-auth-register',
      'GET /test-social-accounts',
      'GET /test-platforms'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🧪 Minimal Test Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔥 Firebase test: http://localhost:${PORT}/test-firebase`);
  console.log(`👤 Auth test: POST http://localhost:${PORT}/test-auth-register`);
  console.log(`📱 Social accounts test: http://localhost:${PORT}/test-social-accounts`);
  console.log(`🌐 Platforms test: http://localhost:${PORT}/test-platforms`);
});

export { app };
