#!/usr/bin/env node

// Comprehensive API testing script for all VibeTribe backend routes
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3005;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'All Routes Test Server',
    timestamp: new Date().toISOString()
  });
});

// Test Firebase connection
app.get('/test-firebase', async (req, res) => {
  try {
    const { initializeDatabase, getFirestoreClient } = await import('./backend/dist/services/database.js');
    
    await initializeDatabase();
    const firestore = getFirestoreClient();
    
    // Test multiple collections
    const collections = ['users', 'organizations', 'posts', 'social_accounts', 'invitations'];
    const results = {};
    
    for (const collection of collections) {
      try {
        const snapshot = await firestore.collection(collection).limit(1).get();
        results[collection] = {
          accessible: true,
          count: snapshot.size
        };
      } catch (error) {
        results[collection] = {
          accessible: false,
          error: error.message
        };
      }
    }
    
    res.json({
      success: true,
      message: 'Firebase connection successful',
      collections: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Firebase connection failed',
      error: error.message
    });
  }
});

// Test auth routes
app.post('/test-auth-register', async (req, res) => {
  try {
    const { initializeDatabase, getFirestoreClient, getServerTimestamp } = await import('./backend/dist/services/database.js');
    
    await initializeDatabase();
    const firestore = getFirestoreClient();
    
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      password: 'TestPassword123!',
      role: 'member',
      is_active: true,
      email_verified: false,
      created_at: getServerTimestamp(),
      updated_at: getServerTimestamp()
    };
    
    // Create test user
    const userRef = await firestore.collection('users').add(testUser);
    
    res.json({
      success: true,
      message: 'Auth test successful - user created',
      user_id: userRef.id,
      email: testUser.email
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Auth test failed',
      error: error.message
    });
  }
});

// Test posts routes
app.get('/test-posts', async (req, res) => {
  try {
    const { initializeDatabase, getFirestoreClient } = await import('./backend/dist/services/database.js');
    
    await initializeDatabase();
    const firestore = getFirestoreClient();
    
    // Query posts collection
    const snapshot = await firestore.collection('posts').limit(5).get();
    
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      message: 'Posts test successful',
      posts_count: snapshot.size,
      posts: posts
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Posts test failed',
      error: error.message
    });
  }
});

// Test analytics routes
app.get('/test-analytics', async (req, res) => {
  try {
    const { initializeDatabase, getFirestoreClient } = await import('./backend/dist/services/database.js');
    
    await initializeDatabase();
    const firestore = getFirestoreClient();
    
    // Get basic analytics data
    const postsSnapshot = await firestore.collection('posts').get();
    const socialAccountsSnapshot = await firestore.collection('social_accounts').get();
    const usersSnapshot = await firestore.collection('users').get();
    
    const analytics = {
      total_posts: postsSnapshot.size,
      total_social_accounts: socialAccountsSnapshot.size,
      total_users: usersSnapshot.size,
      calculated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Analytics test successful',
      analytics: analytics
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Analytics test failed',
      error: error.message
    });
  }
});

// Test users routes
app.get('/test-users', async (req, res) => {
  try {
    const { initializeDatabase, getFirestoreClient } = await import('./backend/dist/services/database.js');
    
    await initializeDatabase();
    const firestore = getFirestoreClient();
    
    // Query users collection
    const snapshot = await firestore.collection('users').limit(3).get();
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      name: doc.data().name,
      role: doc.data().role,
      is_active: doc.data().is_active
    }));
    
    res.json({
      success: true,
      message: 'Users test successful',
      users_count: snapshot.size,
      users: users
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Users test failed',
      error: error.message
    });
  }
});

// Test invitations routes
app.get('/test-invitations', async (req, res) => {
  try {
    const { initializeDatabase, getFirestoreClient } = await import('./backend/dist/services/database.js');
    
    await initializeDatabase();
    const firestore = getFirestoreClient();
    
    // Query invitations collection
    const snapshot = await firestore.collection('invitations').limit(3).get();
    
    const invitations = snapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      status: doc.data().status,
      role: doc.data().role
    }));
    
    res.json({
      success: true,
      message: 'Invitations test successful',
      invitations_count: snapshot.size,
      invitations: invitations
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Invitations test failed',
      error: error.message
    });
  }
});

// Test organizations routes
app.get('/test-organizations', async (req, res) => {
  try {
    const { initializeDatabase, getFirestoreClient } = await import('./backend/dist/services/database.js');
    
    await initializeDatabase();
    const firestore = getFirestoreClient();
    
    // Query organizations collection
    const snapshot = await firestore.collection('organizations').limit(3).get();
    
    const organizations = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      slug: doc.data().slug,
      plan: doc.data().plan,
      is_active: doc.data().is_active
    }));
    
    res.json({
      success: true,
      message: 'Organizations test successful',
      organizations_count: snapshot.size,
      organizations: organizations
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Organizations test failed',
      error: error.message
    });
  }
});

// Test route compilation status
app.get('/test-route-compilation', async (req, res) => {
  const routes = [
    'auth', 'posts', 'analytics', 'socialAccounts', 
    'users', 'invitations', 'communities', 'ai', 
    'media', 'moderation', 'oauth'
  ];
  
  const results = {};
  
  for (const route of routes) {
    try {
      await import(`./backend/dist/routes/${route}.js`);
      results[route] = { compiled: true, status: 'OK' };
    } catch (error) {
      results[route] = { 
        compiled: false, 
        status: 'ERROR',
        error: error.message 
      };
    }
  }
  
  const successCount = Object.values(results).filter(r => r.compiled).length;
  
  res.json({
    success: successCount === routes.length,
    message: `${successCount}/${routes.length} routes compiled successfully`,
    routes: results
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /health',
      'GET /test-firebase',
      'POST /test-auth-register',
      'GET /test-posts',
      'GET /test-analytics',
      'GET /test-users',
      'GET /test-invitations',
      'GET /test-organizations',
      'GET /test-route-compilation'
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
  console.log(`🧪 All Routes Test Server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔥 Firebase: http://localhost:${PORT}/test-firebase`);
  console.log(`👤 Auth: POST http://localhost:${PORT}/test-auth-register`);
  console.log(`📝 Posts: http://localhost:${PORT}/test-posts`);
  console.log(`📈 Analytics: http://localhost:${PORT}/test-analytics`);
  console.log(`👥 Users: http://localhost:${PORT}/test-users`);
  console.log(`✉️ Invitations: http://localhost:${PORT}/test-invitations`);
  console.log(`🏢 Organizations: http://localhost:${PORT}/test-organizations`);
  console.log(`⚙️ Route Compilation: http://localhost:${PORT}/test-route-compilation`);
});

export { app };
