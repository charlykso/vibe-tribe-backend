# VibeTribe Backend Documentation

## 🎯 Overview

The VibeTribe backend is a robust Node.js API server built with Express.js and TypeScript, providing comprehensive social media management capabilities. It features real-time communication, job queuing, secure authentication, and integration with multiple social media platforms.

## 🛠 Technology Stack

### Core Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **TypeScript**: Type-safe development
- **Firebase Firestore**: NoSQL document database
- **Firebase Auth**: Authentication service

### Infrastructure & Services
- **Redis**: Caching and queue management
- **Bull Queue**: Background job processing
- **Socket.io**: Real-time WebSocket communication
- **Cloudinary**: Media storage and optimization
- **Node-cron**: Scheduled task execution

### Security & Validation
- **JWT**: JSON Web Token authentication
- **Helmet**: Security headers middleware
- **Joi/Zod**: Input validation and sanitization
- **bcryptjs**: Password hashing
- **CORS**: Cross-origin resource sharing

### External Integrations
- **OpenAI API**: AI-powered content generation
- **Social Media APIs**: Twitter, LinkedIn, Facebook, Instagram
- **SendGrid**: Email service
- **Stripe**: Payment processing

## 📁 Project Structure

```
backend/
├── src/
│   ├── routes/                  # API route handlers
│   │   ├── auth.ts             # Authentication endpoints
│   │   ├── users.ts            # User management
│   │   ├── socialAccounts.ts   # Social media accounts
│   │   ├── posts.ts            # Post management
│   │   ├── analytics.ts        # Analytics endpoints
│   │   ├── media.ts            # File upload/management
│   │   ├── communities.ts      # Community management
│   │   ├── moderation.ts       # Moderation tools
│   │   ├── oauth.ts            # OAuth integration
│   │   ├── invitations.ts      # Team invitations
│   │   └── ai.ts               # AI-powered features
│   ├── middleware/              # Express middleware
│   │   ├── auth.ts             # JWT authentication
│   │   ├── errorHandler.ts     # Error handling
│   │   ├── requestLogger.ts    # Request logging
│   │   ├── requestValidation.ts # Input validation
│   │   ├── securityHeaders.ts  # Security headers
│   │   ├── inputSanitization.ts # Input sanitization
│   │   ├── advancedRateLimit.ts # Rate limiting
│   │   └── csrfProtection.ts   # CSRF protection
│   ├── services/                # Business logic services
│   │   ├── database.ts         # Firebase Firestore client
│   │   ├── websocket.ts        # WebSocket handling
│   │   ├── queue.ts            # Bull Queue management
│   │   ├── cron.ts             # Background job scheduling
│   │   ├── email.ts            # Email service
│   │   ├── media.ts            # Media processing
│   │   ├── socialMedia.ts      # Social media integration
│   │   ├── oauth.ts            # OAuth service
│   │   ├── ai.ts               # AI service integration
│   │   ├── community.ts        # Community management
│   │   ├── moderation.ts       # Content moderation
│   │   └── analyticsSync.ts    # Analytics synchronization
│   ├── types/                   # TypeScript type definitions
│   │   ├── database.ts         # Database interfaces
│   │   └── express.ts          # Express type extensions
│   ├── scripts/                 # Utility scripts
│   │   ├── migrate.ts          # Database migration
│   │   ├── test-firebase.ts    # Firebase testing
│   │   ├── test-auth.ts        # Authentication testing
│   │   └── schedule-analytics-sync.ts # Analytics scheduling
│   ├── __tests__/               # Test files
│   │   ├── auth.test.ts
│   │   ├── analytics.test.ts
│   │   ├── security.test.ts
│   │   └── setup.ts
│   └── server.ts                # Main server entry point
├── dist/                        # Compiled JavaScript
├── migrations/                  # Database migrations
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Jest testing configuration
├── Procfile                    # Process file for deployment
├── render.yaml                 # Render deployment config
└── README.md                   # Backend-specific documentation
```

## 🗄 Database Schema

### Firebase Firestore Collections

#### Users Collection
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'moderator' | 'member';
  organization_id?: string;
  email_verified: boolean;
  verification_token?: string;
  verification_token_expires?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
  last_login?: Timestamp;
  is_active: boolean;
}
```

#### Organizations Collection
```typescript
interface Organization {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size?: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: {
    timezone: string;
    default_posting_times: string[];
    approval_required: boolean;
    auto_schedule: boolean;
  };
  billing: {
    stripe_customer_id?: string;
    subscription_id?: string;
    plan_expires_at?: Timestamp;
  };
  created_at: Timestamp;
  updated_at: Timestamp;
  is_active: boolean;
}
```

#### Posts Collection
```typescript
interface Post {
  id: string;
  organization_id: string;
  created_by: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  content: string;
  media: MediaItem[];
  platforms: PlatformPost[];
  scheduled_for?: Timestamp;
  published_at?: Timestamp;
  settings: PostSettings;
  analytics: PostAnalytics;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

#### Social Accounts Collection
```typescript
interface SocialAccount {
  id: string;
  organization_id: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  platform_user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: Timestamp;
  permissions: string[];
  is_active: boolean;
  last_sync_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

#### Analytics Collection
```typescript
interface Analytics {
  id: string;
  organization_id: string;
  post_id?: string;
  platform: string;
  date: string; // YYYY-MM-DD format
  metrics: {
    impressions: number;
    engagements: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    reach: number;
    saves?: number;
  };
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

## 🔐 Authentication & Authorization

### JWT Authentication
```typescript
// JWT token structure
interface JWTPayload {
  userId: string;
  organizationId: string;
  role: string;
  iat: number;
  exp: number;
}

// Authentication middleware
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

### Role-Based Access Control
- **Admin**: Full system access, user management, billing
- **Moderator**: Content management, community moderation
- **Member**: Basic posting and analytics access

### Organization Scoping
All data access is scoped to the user's organization to ensure data isolation and security.

## 🛣 API Routes

### Authentication Routes (`/api/v1/auth`)
```typescript
POST   /register          # User registration
POST   /login             # User login
POST   /logout            # User logout
POST   /refresh           # Token refresh
POST   /forgot-password   # Password reset request
POST   /reset-password    # Password reset confirmation
GET    /verify-email      # Email verification
POST   /resend-verification # Resend verification email
```

### User Management (`/api/v1/users`)
```typescript
GET    /profile           # Get user profile
PUT    /profile           # Update user profile
GET    /organization      # Get organization details
PUT    /organization      # Update organization
GET    /members           # List organization members
POST   /invite            # Invite new member
DELETE /members/:id       # Remove member
PUT    /members/:id/role  # Update member role
```

### Social Accounts (`/api/v1/social-accounts`)
```typescript
GET    /                  # List connected accounts
POST   /connect           # Connect new account
DELETE /:id               # Disconnect account
PUT    /:id/refresh       # Refresh account tokens
GET    /:id/profile       # Get account profile
POST   /:id/test          # Test account connection
```

### Posts Management (`/api/v1/posts`)
```typescript
GET    /                  # List posts with pagination
POST   /                  # Create new post
GET    /:id               # Get specific post
PUT    /:id               # Update post
DELETE /:id               # Delete post
POST   /:id/publish       # Publish post immediately
POST   /:id/schedule      # Schedule post
POST   /:id/duplicate     # Duplicate post
GET    /drafts            # List draft posts
GET    /scheduled         # List scheduled posts
```

### Analytics (`/api/v1/analytics`)
```typescript
GET    /overview          # Analytics overview
GET    /posts/:id         # Post-specific analytics
GET    /platforms         # Platform performance
GET    /engagement        # Engagement metrics
GET    /growth            # Growth analytics
POST   /export            # Export analytics data
GET    /sync              # Trigger analytics sync
```

### Media Management (`/api/v1/media`)
```typescript
POST   /upload            # Upload media file
GET    /                  # List media files
DELETE /:id               # Delete media file
PUT    /:id               # Update media metadata
POST   /:id/crop          # Crop image
GET    /:id/variants      # Get image variants
```

## ⚙️ Services Architecture

### Database Service
```typescript
// Firebase Firestore client initialization
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!, 'base64').toString()
);

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

export const db = getFirestore();
```

### Queue Service
```typescript
// Bull Queue for background job processing
import Queue from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const postQueue = new Queue('post publishing', { redis });

// Job processors
postQueue.process('publish-post', async (job) => {
  const { postId, platforms } = job.data;
  await publishToSocialMedia(postId, platforms);
});

// Schedule post publishing
export const schedulePost = async (postId: string, publishAt: Date) => {
  await postQueue.add('publish-post', { postId }, {
    delay: publishAt.getTime() - Date.now(),
    attempts: 3,
    backoff: 'exponential',
  });
};
```

### WebSocket Service
```typescript
// Real-time communication with Socket.io
import { Server } from 'socket.io';

export const initializeWebSocket = (server: any) => {
  const io = new Server(server, {
    cors: { origin: process.env.CORS_ORIGIN }
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    socket.on('join-organization', (orgId) => {
      socket.join(`org:${orgId}`);
    });

    socket.on('post-update', (data) => {
      socket.to(`org:${data.organizationId}`).emit('post-updated', data);
    });
  });

  return io;
};
```

### Social Media Service
```typescript
// Social media platform integrations
export class SocialMediaService {
  async publishToTwitter(content: string, media: string[], accountId: string) {
    const account = await getSocialAccount(accountId);
    const client = new TwitterApi(account.access_token);
    
    let mediaIds: string[] = [];
    if (media.length > 0) {
      mediaIds = await this.uploadMediaToTwitter(client, media);
    }

    const tweet = await client.v2.tweet({
      text: content,
      media: mediaIds.length > 0 ? { media_ids: mediaIds } : undefined,
    });

    return tweet.data;
  }

  async publishToLinkedIn(content: string, media: string[], accountId: string) {
    // LinkedIn API implementation
  }

  async publishToFacebook(content: string, media: string[], accountId: string) {
    // Facebook API implementation
  }

  async publishToInstagram(content: string, media: string[], accountId: string) {
    // Instagram API implementation
  }
}
```

## 🔄 Background Jobs & Cron Tasks

### Scheduled Jobs
```typescript
// Node-cron for scheduled tasks
import cron from 'node-cron';

export const initializeCronJobs = () => {
  // Analytics sync every hour
  cron.schedule('0 * * * *', async () => {
    await syncAnalyticsData();
  });

  // Clean up expired tokens daily
  cron.schedule('0 2 * * *', async () => {
    await cleanupExpiredTokens();
  });

  // Health check every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await performHealthCheck();
  });
};
```

### Queue Job Types
- **Post Publishing**: Scheduled social media posts
- **Analytics Sync**: Fetch latest engagement data
- **Email Notifications**: User notifications and alerts
- **Media Processing**: Image optimization and variants
- **Data Cleanup**: Remove expired tokens and old data

## 🔒 Security Implementation

### Input Validation
```typescript
// Zod schema validation
import { z } from 'zod';

const createPostSchema = z.object({
  content: z.string().min(1).max(10000),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'facebook', 'instagram'])),
  scheduled_for: z.string().datetime().optional(),
  media: z.array(z.string().url()).optional(),
});

// Validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
  };
};
```

### Security Headers
```typescript
// Comprehensive security headers
import helmet from 'helmet';

export const comprehensiveSecurityHeaders = () => [
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }),
  helmet.hsts({ maxAge: 31536000, includeSubDomains: true }),
  helmet.noSniff(),
  helmet.xssFilter(),
  helmet.referrerPolicy({ policy: 'same-origin' }),
];
```

### Rate Limiting
```typescript
// Advanced rate limiting
import rateLimit from 'express-rate-limit';

export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different limits for different endpoints
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes
export const apiRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
```

## 🧪 Testing Strategy

### Test Configuration
```typescript
// Jest configuration for TypeScript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
```

### Test Types
- **Unit Tests**: Individual function and service testing
- **Integration Tests**: API endpoint testing with Supertest
- **Security Tests**: Authentication and authorization testing
- **Performance Tests**: Load testing for critical endpoints

## 📊 Monitoring & Logging

### Request Logging
```typescript
// Winston logger configuration
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    }),
  ],
});
```

### Health Checks
```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      queue: await checkQueueHealth(),
    },
  };

  const isHealthy = Object.values(health.services).every(service => service === 'healthy');
  res.status(isHealthy ? 200 : 503).json(health);
});
```

## 🚀 Deployment

### Environment Configuration
```env
# Server Configuration
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com

# Database
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account

# Authentication
JWT_SECRET=your_super_secure_jwt_secret
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://your-redis-instance:6379

# External Services
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_key
SENDGRID_API_KEY=your_sendgrid_key

# Social Media OAuth (Base64 encoded)
TWITTER_OAUTH_BASE64=your_encoded_credentials
LINKEDIN_OAUTH_BASE64=your_encoded_credentials
FACEBOOK_OAUTH_BASE64=your_encoded_credentials
INSTAGRAM_OAUTH_BASE64=your_encoded_credentials
```

### Render Deployment
```yaml
# render.yaml
services:
  - type: web
    name: vibe-tribe-backend
    env: node
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
```

### Production Considerations
- **Process Management**: PM2 for process monitoring
- **Load Balancing**: Multiple server instances
- **Database Scaling**: Firestore automatic scaling
- **Caching Strategy**: Redis for session and data caching
- **Error Monitoring**: Sentry integration for error tracking
- **Performance Monitoring**: Application performance metrics

## 🔧 Troubleshooting

### Common Issues
1. **Firebase Connection**: Verify service account credentials
2. **Redis Connection**: Check Redis URL and connectivity
3. **OAuth Errors**: Validate social media app configurations
4. **Queue Processing**: Monitor Bull Queue dashboard
5. **Memory Issues**: Optimize database queries and caching

### Debug Tools
- **Logs**: Winston logging with different levels
- **Database**: Firebase console for data inspection
- **Queue**: Bull Queue UI for job monitoring
- **API**: Postman/Insomnia for endpoint testing

## 📈 Performance Optimization

### Database Optimization
- Firestore compound indexes for complex queries
- Pagination for large result sets
- Caching frequently accessed data
- Batch operations for bulk updates

### API Optimization
- Response compression with gzip
- Request/response caching
- Database connection pooling
- Async/await for non-blocking operations

### Memory Management
- Garbage collection monitoring
- Memory leak detection
- Efficient data structures
- Stream processing for large files

## 🔮 Future Enhancements

### Planned Features
- **Microservices Architecture**: Split into domain-specific services
- **GraphQL API**: Alternative to REST for flexible queries
- **Event Sourcing**: Audit trail and data versioning
- **Advanced Analytics**: Machine learning insights
- **Multi-tenant Architecture**: Support for multiple organizations
- **API Rate Limiting**: Per-user and per-organization limits

### Technical Improvements
- **Database Sharding**: Horizontal scaling strategy
- **Caching Layer**: Redis Cluster for high availability
- **Message Queue**: RabbitMQ for complex workflows
- **Monitoring**: Comprehensive observability stack
- **Security**: Advanced threat detection and prevention
