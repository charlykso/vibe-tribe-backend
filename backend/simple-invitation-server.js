import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 Starting simple invitation server...');

const app = express();
const PORT = 3001;

// Basic middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Simple invitation server is working'
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

// Mock auth endpoints
app.post('/api/v1/auth/login', (req, res) => {
  console.log('🔐 Mock login request:', req.body);
  res.status(400).json({
    error: 'Database not initialized. Call initializeDatabase() first.',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: '/api/v1/auth/login',
    method: 'POST'
  });
});

// Mock Google OAuth endpoints
app.get('/api/v1/auth/google/initiate', (req, res) => {
  console.log('🔐 Mock Google OAuth initiate request');
  res.json({
    message: 'Google OAuth requires database initialization',
    status: 'disabled',
    note: 'Enable database to use Google Sign-In',
    authUrl: null
  });
});

app.get('/api/v1/auth/google/callback', (req, res) => {
  console.log('🔐 Mock Google OAuth callback');
  res.json({
    message: 'Google OAuth callback requires database initialization',
    status: 'disabled'
  });
});

app.post('/api/v1/auth/register', (req, res) => {
  console.log('📝 Mock register request:', req.body);
  res.status(400).json({
    error: 'Database not initialized. Call initializeDatabase() first.',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: '/api/v1/auth/register',
    method: 'POST'
  });
});

app.post('/api/v1/auth/logout', (req, res) => {
  console.log('🚪 Mock logout request');
  res.json({
    message: 'Logged out successfully (mock)'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Serve a simple HTML page for accept-invitation route
app.get('/accept-invitation', (req, res) => {
  const token = req.query.token || 'no-token';
  console.log('🎟️ Accept invitation page requested with token:', token);

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accept Invitation - Tribe</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
      .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-top: 20px; }
      h1 { color: #333; }
      .form-group { margin-bottom: 15px; }
      label { display: block; margin-bottom: 5px; font-weight: bold; }
      input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
      button { background: #4a6cf7; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
      button:hover { background: #3a5ce5; }
      .error { color: red; margin-top: 10px; }
    </style>
  </head>
  <body>
    <h1>Accept Invitation</h1>
    <div class="card">
      <p>You've been invited to join Tribe! Please complete your registration below.</p>
      <div class="form-group">
        <label for="name">Full Name</label>
        <input type="text" id="name" placeholder="Enter your full name">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" placeholder="Create a password">
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input type="password" id="confirmPassword" placeholder="Confirm your password">
      </div>
      <button onclick="acceptInvitation()">Accept Invitation</button>
      <div id="error" class="error"></div>
    </div>

    <script>
      // Store the invitation token
      const invitationToken = '${token}';

      async function acceptInvitation() {
        const name = document.getElementById('name').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorElement = document.getElementById('error');

        // Basic validation
        if (!name || !password) {
          errorElement.textContent = 'Please fill in all fields';
          return;
        }

        if (password !== confirmPassword) {
          errorElement.textContent = 'Passwords do not match';
          return;
        }

        try {
          const response = await fetch('/api/v1/invitations/accept', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              token: invitationToken,
              name,
              password
            })
          });

          const data = await response.json();

          if (response.ok) {
            // Success - redirect to login
            alert('Invitation accepted successfully! You can now log in.');
            window.location.href = '/';
          } else {
            // Error
            errorElement.textContent = data.error || 'Failed to accept invitation';
          }
        } catch (error) {
          errorElement.textContent = 'An error occurred. Please try again.';
          console.error('Error accepting invitation:', error);
        }
      }
    </script>
  </body>
  </html>
  `;

  res.send(html);
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

console.log('📝 Starting HTTP server...');
// Start server on IPv4 localhost
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Simple invitation server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📧 Invitation endpoint: POST http://localhost:${PORT}/api/v1/invitations/invite`);
  console.log(`📋 List invitations: GET http://localhost:${PORT}/api/v1/invitations`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

server.on('listening', () => {
  console.log('✅ Server is listening on port', server.address());
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
