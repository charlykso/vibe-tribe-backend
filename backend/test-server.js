import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, initializeCollections } from './dist/services/database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/v1/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Initialize services
async function startServer() {
  try {
    console.log('🚀 Starting test server...');

    console.log('📝 Step 1: Initializing Firebase database...');
    await initializeDatabase();
    console.log('✅ Firebase database initialized successfully');

    console.log('📝 Step 2: Initializing Firestore collections...');
    await initializeCollections();
    console.log('✅ Firestore collections initialized successfully');

    console.log('📝 Step 3: Starting HTTP server...');
    // Start server on IPv4 localhost
    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 Test server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/v1/test`);
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });

    server.on('listening', () => {
      console.log('✅ Server is actually listening on port', server.address());
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
