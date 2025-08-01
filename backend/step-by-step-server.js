import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Step 1: Basic setup complete');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

console.log('Step 2: Middleware configured');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Step-by-step server is working'
  });
});

console.log('Step 3: Health endpoint configured');

// Test login endpoint that reproduces your original error
app.post('/api/v1/auth/login', (req, res) => {
  res.status(500).json({
    error: 'Database not initialized. Call initializeDatabase() first.',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: '/api/v1/auth/login',
    method: 'POST',
    requestId: 'test-' + Date.now()
  });
});

console.log('Step 4: Test login endpoint configured');

console.log('Step 5: Starting server...');

// Start server on IPv4 localhost
const server = app.listen(Number(PORT), '127.0.0.1', () => {
  console.log('Step 6: Server callback executed');
  console.log(`🚀 Step-by-step server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Test login: POST http://localhost:${PORT}/api/v1/auth/login`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

server.on('listening', () => {
  console.log('Step 7: Server is actually listening on port', server.address());
});

console.log('Step 8: Server setup complete, waiting for listen callback...');
