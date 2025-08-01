import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Real Server with Database...');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

console.log('✅ Middleware configured');

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Real server with database is running'
  });
});

console.log('✅ Health endpoint configured');

// Initialize database and start server
async function startServer() {
  try {
    console.log('📝 Step 1: Importing database service...');
    const { initializeDatabase, initializeCollections } = await import('./dist/services/database.js');
    
    console.log('📝 Step 2: Initializing Firebase database...');
    await initializeDatabase();
    console.log('✅ Firebase database initialized successfully');

    console.log('📝 Step 3: Initializing Firestore collections...');
    await initializeCollections();
    console.log('✅ Firestore collections initialized successfully');

    console.log('📝 Step 4: Importing auth routes...');
    const authRoutes = await import('./dist/routes/auth.js');
    
    console.log('📝 Step 5: Setting up auth routes...');
    app.use('/api/v1/auth', authRoutes.default);
    console.log('✅ Auth routes configured');

    console.log('📝 Step 6: Starting HTTP server...');
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`✅ Real server running on http://localhost:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/health`);
      console.log(`🔐 Login: POST http://localhost:${PORT}/api/v1/auth/login`);
      console.log(`🎉 Database is initialized and ready!`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Start the server
startServer();
