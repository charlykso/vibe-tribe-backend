const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

console.log('Setting up routes...');

// Health check
app.get('/api/v1/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', message: 'VibeTribe API is running' });
});

// Analytics endpoint
app.get('/api/v1/analytics/overview', (req, res) => {
  console.log('Analytics overview requested');
  res.json({
    totalMembers: 24847,
    activeMembers: 18492,
    messagesToday: 3847,
    engagementRate: 74.8,
    growth: {
      members: 12.5,
      active: 8.2,
      messages: 23.1,
      engagement: 4.3
    }
  });
});

// Community stats endpoint
app.get('/api/v1/community/stats', (req, res) => {
  console.log('Community stats requested');
  res.json({
    totalMembers: 24847,
    activeMembers: 18492,
    newMembersToday: 127,
    engagementRate: 74.8,
    communities: [
      { name: 'Discord Community', members: 15420, status: 'healthy', change: 5.2 },
      { name: 'Telegram Group', members: 8947, status: 'growing', change: 12.8 },
      { name: 'Slack Workspace', members: 2340, status: 'stable', change: -2.1 }
    ]
  });
});

// Recent activity endpoint
app.get('/api/v1/activity/recent', (req, res) => {
  console.log('Recent activity requested');
  res.json({
    activities: [
      {
        id: 1,
        type: 'member_joined',
        title: 'John Smith joined the community',
        time: '2 minutes ago',
        icon: 'Users'
      },
      {
        id: 2,
        type: 'engagement',
        title: 'Post about product updates got 150+ reactions',
        time: '15 minutes ago',
        icon: 'Heart'
      },
      {
        id: 3,
        type: 'moderation',
        title: 'Spam message auto-removed in #general',
        time: '32 minutes ago',
        icon: 'AlertTriangle'
      },
      {
        id: 4,
        type: 'milestone',
        title: 'Community reached 25K members!',
        time: '1 hour ago',
        icon: 'CheckCircle'
      }
    ]
  });
});

// Auth endpoints
app.post('/api/v1/auth/login', (req, res) => {
  console.log('Login requested:', req.body);
  const { email, password } = req.body;
  
  if (email && password) {
    const token = 'mock-jwt-token-' + Date.now();
    res.json({ 
      user: { 
        id: '1',
        email: email,
        name: 'Admin User',
        displayName: 'Admin User',
        role: 'admin'
      }, 
      token 
    });
  } else {
    res.status(400).json({ error: 'Email and password required' });
  }
});

app.get('/api/v1/auth/me', (req, res) => {
  console.log('Auth me requested');
  res.json({ 
    user: { 
      id: '1',
      email: 'admin@vibetrbe.com',
      name: 'Admin User',
      displayName: 'Admin User',
      role: 'admin'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  console.log('404 for:', req.method, req.url);
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 VibeTribe Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/v1/health`);
  console.log(`📈 Analytics: http://localhost:${PORT}/api/v1/analytics/overview`);
  console.log(`👥 Community: http://localhost:${PORT}/api/v1/community/stats`);
  console.log(`📋 Activity: http://localhost:${PORT}/api/v1/activity/recent`);
});
