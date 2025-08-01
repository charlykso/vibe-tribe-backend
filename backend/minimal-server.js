import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 Starting minimal server...');

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
    message: 'Minimal server is working'
  });
});

// Test login endpoint (without database)
app.post('/api/v1/auth/login', (req, res) => {
  res.status(400).json({
    error: 'Database not initialized. Call initializeDatabase() first.',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: '/api/v1/auth/login',
    method: 'POST'
  });
});

// Mock invitation endpoints for testing
app.post('/api/v1/invitations/invite', (req, res) => {
  console.log('📧 Mock invitation request received:', req.body);

  // Simulate successful invitation
  res.status(201).json({
    message: 'Invitation sent successfully (mock)',
    invitation: {
      id: 'mock-invitation-' + Date.now(),
      email: req.body.email,
      role: req.body.role || 'member',
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  });
});

app.get('/api/v1/invitations', (req, res) => {
  console.log('📋 Mock invitations list request');

  res.json({
    invitations: [
      {
        id: 'mock-invitation-1',
        email: 'test@example.com',
        role: 'member',
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  });
});

app.post('/api/v1/invitations/accept', (req, res) => {
  console.log('✅ Mock invitation acceptance:', req.body);

  res.json({
    message: 'Invitation accepted successfully (mock)',
    user: {
      id: 'mock-user-' + Date.now(),
      email: req.body.email,
      name: req.body.name,
      role: 'member'
    }
  });
});

app.delete('/api/v1/invitations/:id', (req, res) => {
  console.log('🗑️ Mock invitation deletion:', req.params.id);

  res.json({
    message: 'Invitation deleted successfully (mock)'
  });
});

app.post('/api/v1/invitations/:id/resend', (req, res) => {
  console.log('🔄 Mock invitation resend:', req.params.id);

  res.json({
    message: 'Invitation resent successfully (mock)'
  });
});

console.log('📝 Starting HTTP server...');
// Start server on IPv4 localhost
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Login test: http://localhost:${PORT}/api/v1/auth/login`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

server.on('listening', () => {
  console.log('✅ Server is listening on port', server.address());
});
