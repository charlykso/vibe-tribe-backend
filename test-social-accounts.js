#!/usr/bin/env node

// Test script for social accounts endpoints
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3004;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Social Accounts Test Server' });
});

// Test the social accounts route
app.use('/test-social-accounts', async (req, res, next) => {
  try {
    // Import the database service
    const { initializeDatabase, getFirestoreClient } = await import('./backend/dist/services/database.js');
    
    // Initialize Firebase
    await initializeDatabase();
    console.log('✅ Firebase initialized for social accounts test');
    
    // Add mock user to request for testing
    req.user = {
      id: 'test-user-id',
      organization_id: 'test-org-id',
      email: 'test@example.com'
    };
    
    next();
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    res.status(500).json({
      error: 'Firebase initialization failed',
      message: error.message
    });
  }
});

// Import and use the social accounts router
app.use('/test-social-accounts', async (req, res, next) => {
  try {
    // Import the social accounts router
    const socialAccountsRouter = await import('./backend/dist/routes/socialAccounts.js');
    
    // Use the router
    socialAccountsRouter.default(req, res, next);
  } catch (error) {
    console.error('❌ Social accounts router error:', error);
    res.status(500).json({
      error: 'Social accounts router failed',
      message: error.message
    });
  }
});

// Test platforms endpoint directly
app.get('/test-platforms-direct', (req, res) => {
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

// Test Firebase social accounts collection directly
app.get('/test-firebase-social-accounts', async (req, res) => {
  try {
    const { initializeDatabase, getFirestoreClient } = await import('./backend/dist/services/database.js');
    
    await initializeDatabase();
    const firestore = getFirestoreClient();
    
    // Query social accounts collection
    const snapshot = await firestore.collection('social_accounts').limit(5).get();
    
    const accounts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      message: 'Firebase social accounts query successful',
      count: snapshot.size,
      accounts: accounts
    });
    
  } catch (error) {
    console.error('❌ Firebase social accounts test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test creating a social account
app.post('/test-create-social-account', async (req, res) => {
  try {
    const { initializeDatabase, getFirestoreClient, getServerTimestamp } = await import('./backend/dist/services/database.js');
    
    await initializeDatabase();
    const firestore = getFirestoreClient();
    
    // Create a test social account
    const accountRef = firestore.collection('social_accounts').doc();
    const testAccount = {
      user_id: 'test-user-id',
      organization_id: 'test-org-id',
      platform: 'twitter',
      platform_user_id: 'test-twitter-123',
      username: 'testuser',
      display_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      access_token: 'test-token',
      permissions: ['read', 'write'],
      is_active: true,
      created_at: getServerTimestamp(),
      updated_at: getServerTimestamp()
    };
    
    await accountRef.set(testAccount);
    
    res.json({
      success: true,
      message: 'Test social account created successfully',
      account_id: accountRef.id
    });
    
  } catch (error) {
    console.error('❌ Create social account test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /health',
      'GET /test-platforms-direct',
      'GET /test-firebase-social-accounts',
      'POST /test-create-social-account',
      'GET /test-social-accounts/platforms/supported'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🧪 Social Accounts Test Server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🌐 Platforms: http://localhost:${PORT}/test-platforms-direct`);
  console.log(`🔥 Firebase test: http://localhost:${PORT}/test-firebase-social-accounts`);
  console.log(`➕ Create account: POST http://localhost:${PORT}/test-create-social-account`);
  console.log(`📱 Social accounts: http://localhost:${PORT}/test-social-accounts/platforms/supported`);
});

export { app };
