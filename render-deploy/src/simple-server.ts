import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(helmet());

const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:8080'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    firebase_project: process.env.FIREBASE_PROJECT_ID || 'not configured',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock auth endpoints
app.post('/api/v1/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, name'
      });
    }

    // Mock user data
    const user = {
      id: `user-${Date.now()}`,
      email,
      name,
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      role: 'member',
      organization_id: 'org-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const token = `jwt-token-${user.id}-${Date.now()}`;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
      token
    });

  } catch (error) {
    res.status(500).json({
      error: 'Registration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields: email, password'
      });
    }

    // Mock user data
    const user = {
      id: 'user-1',
      email,
      name: 'Test User',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      role: 'member',
      organization_id: 'org-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    };

    const token = `jwt-token-${user.id}-${Date.now()}`;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user,
      token
    });

  } catch (error) {
    res.status(500).json({
      error: 'Login failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mock auth/me endpoint
app.get('/api/v1/auth/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    // Mock user data
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      role: 'member',
      organization_id: 'org-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mock posts endpoints
app.get('/api/v1/posts', async (req: Request, res: Response) => {
  const mockPosts = [
    {
      id: '1',
      content: 'Excited to share our latest product update! 🚀 #innovation #tech',
      platforms: ['twitter', 'linkedin'],
      status: 'published',
      published_date: '2024-01-15T10:00:00Z',
      analytics: {
        views: 1250,
        likes: 89,
        shares: 23,
        comments: 12,
      },
      created_at: '2024-01-15T09:30:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      organization_id: 'org-1',
      user_id: 'user-1',
    },
    {
      id: '2',
      content: 'Join us for our upcoming webinar on digital transformation strategies.',
      platforms: ['linkedin', 'facebook'],
      status: 'scheduled',
      scheduled_date: '2024-01-20T14:00:00Z',
      created_at: '2024-01-15T11:00:00Z',
      updated_at: '2024-01-15T11:00:00Z',
      organization_id: 'org-1',
      user_id: 'user-1',
    },
  ];

  res.json({
    posts: mockPosts,
    total: mockPosts.length
  });
});

app.post('/api/v1/posts', async (req: Request, res: Response) => {
  try {
    const { content, platforms, scheduled_date } = req.body;

    const post = {
      id: `post-${Date.now()}`,
      content,
      platforms,
      status: scheduled_date ? 'scheduled' : 'draft',
      scheduled_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organization_id: 'org-1',
      user_id: 'user-1',
    };

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to create post',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/v1/posts/:id/publish', async (req: Request, res: Response) => {
  try {
    const post = {
      id: req.params.id,
      status: 'published',
      published_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: 'Post published successfully',
      post
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to publish post',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Social accounts endpoints - now using real Firebase data
app.get('/api/v1/social-accounts', async (req: Request, res: Response) => {
  try {
    // This will be handled by the real backend with Firebase
    // For now, return empty array to allow real OAuth connections
    res.json({
      accounts: [],
      total: 0,
      message: 'Connected accounts retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    res.status(500).json({
      error: 'Failed to fetch social accounts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// OAuth initiate endpoint - redirects to real backend
app.post('/api/v1/oauth/initiate', async (req: Request, res: Response) => {
  try {
    const { platform } = req.body;

    if (!platform) {
      return res.status(400).json({
        error: 'Platform is required'
      });
    }

    // Redirect to real backend for OAuth handling
    const backendUrl = process.env.BACKEND_URL || 'https://vibe-tribe-backend-8yvp.onrender.com';

    res.json({
      authUrl: `${backendUrl}/api/v1/oauth/${platform}/authorize`,
      state: `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      platform,
      message: `Redirecting to real OAuth for ${platform}`
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to initiate OAuth',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 404 handler
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('🚀 VibeTribe Backend Server Started!');
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
  console.log(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID || 'Mock Mode'}`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log('  POST /api/v1/auth/register - User registration');
  console.log('  POST /api/v1/auth/login - User login');
  console.log('  GET  /api/v1/auth/me - Get current user');
  console.log('  GET  /api/v1/posts - List posts');
  console.log('  POST /api/v1/posts - Create post');
  console.log('  POST /api/v1/posts/:id/publish - Publish post');
  console.log('  GET  /api/v1/social-accounts - List connected accounts');
  console.log('  POST /api/v1/oauth/initiate - Start OAuth flow');
  console.log('');
  console.log('✅ Ready for frontend integration!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

export { app };
