const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🚀 Starting Quick Server (CommonJS)...');

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
    message: 'Quick server (CommonJS) is running'
  });
});

// Login endpoint that reproduces your error for testing
app.post('/api/v1/auth/login', (req, res) => {
  console.log('📝 Login request received:', req.body);
  res.status(500).json({
    error: 'Database not initialized. Call initializeDatabase() first.',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: '/api/v1/auth/login',
    method: 'POST',
    requestId: 'quick-' + Date.now()
  });
});

console.log('✅ Routes configured');

// Start server
console.log('🚀 Starting server on port', PORT);
app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Quick server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/v1/auth/login`);
});

console.log('📝 Server setup complete');
