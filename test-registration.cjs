// Test Registration Functionality
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081'],
  credentials: true
}));
app.use(express.json());

// Mock user storage
let users = [
  {
    id: '1',
    email: 'admin@vibetrybe.com',
    name: 'Admin User',
    password: 'admin123',
    role: 'admin',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    email: 'user@vibetrybe.com',
    name: 'Regular User',
    password: 'user123',
    role: 'member',
    created_at: new Date().toISOString()
  }
];

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Registration test server is running'
  });
});

// Registration endpoint
app.post('/api/v1/auth/register', (req, res) => {
  console.log('📝 Registration request received:', req.body);
  
  const { name, email, password, organizationName } = req.body;
  
  // Validation
  if (!name || name.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Name must be at least 2 characters'
    });
  }
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Valid email is required'
    });
  }
  
  if (!password || password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters'
    });
  }
  
  // Check if user already exists
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'User with this email already exists'
    });
  }
  
  // Create new user
  const newUser = {
    id: (users.length + 1).toString(),
    email,
    name,
    password, // In real app, this would be hashed
    role: 'member',
    organizationName: organizationName || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  users.push(newUser);
  
  // Generate mock JWT token
  const token = `mock-jwt-token-${newUser.id}-${Date.now()}`;
  
  console.log('✅ User registered successfully:', {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name
  });
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      organization_id: newUser.organizationName,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    },
    token
  });
});

// Login endpoint
app.post('/api/v1/auth/login', (req, res) => {
  console.log('🔐 Login request received:', req.body);
  
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }
  
  const token = `mock-jwt-token-${user.id}-${Date.now()}`;
  
  console.log('✅ User logged in successfully:', {
    id: user.id,
    email: user.email,
    name: user.name
  });
  
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization_id: user.organizationName,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    token
  });
});

// List all users (for testing)
app.get('/api/v1/users', (req, res) => {
  res.json({
    success: true,
    users: users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at
    }))
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Registration test server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`📝 Registration: POST http://localhost:${PORT}/api/v1/auth/register`);
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`👥 Users list: GET http://localhost:${PORT}/api/v1/users`);
  console.log(`\n📋 Test the registration with:`);
  console.log(`curl -X POST http://localhost:${PORT}/api/v1/auth/register \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"name":"Test User","email":"newuser@example.com","password":"TestPassword123","organizationName":"Test Org"}'`);
});
