// Minimal Backend for Testing Registration
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3005;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mock users storage
let users = [
  {
    id: '1',
    email: 'admin@vibetrybe.com',
    name: 'Admin User',
    password: 'admin123',
    role: 'admin',
    created_at: new Date().toISOString()
  }
];

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Minimal backend is running'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'API is healthy'
  });
});

// Registration endpoint
app.post('/api/v1/auth/register', (req, res) => {
  console.log('📝 Registration request:', req.body);
  
  const { name, email, password, organizationName } = req.body;
  
  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Name, email, and password are required'
    });
  }
  
  // Check if user exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'User with this email already exists'
    });
  }
  
  // Create user
  const newUser = {
    id: (users.length + 1).toString(),
    email,
    name,
    password, // In real app, hash this
    role: 'member',
    organization_name: organizationName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  users.push(newUser);
  
  console.log('✅ User registered:', { id: newUser.id, email, name });
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      organization_id: newUser.organization_name,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    },
    token: `mock-token-${newUser.id}-${Date.now()}`
  });
});

// Login endpoint
app.post('/api/v1/auth/login', (req, res) => {
  console.log('🔐 Login request:', { email: req.body.email });
  
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }
  
  console.log('✅ User logged in:', { id: user.id, email: user.email });
  
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization_id: user.organization_name,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    token: `mock-token-${user.id}-${Date.now()}`
  });
});

// List users
app.get('/api/v1/users', (req, res) => {
  res.json({
    success: true,
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      created_at: u.created_at
    }))
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Minimal Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/v1/health`);
  console.log(`📝 Register: POST http://localhost:${PORT}/api/v1/auth/register`);
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`👥 Users: GET http://localhost:${PORT}/api/v1/users`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
});
