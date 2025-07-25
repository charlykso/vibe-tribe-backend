# Tribe Backend

This is the backend API for the Tribe social media management platform.

## 🚀 Technology Stack

- **Runtime**: Node.js with Express.js
- **Database**: Firebase Firestore
- **Authentication**: JWT with Firebase Auth
- **Queue System**: Bull Queue with Redis
- **Media Storage**: Cloudinary
- **Real-time**: Socket.io
- **Scheduling**: Node-cron
- **Language**: TypeScript

## 🎯 Phase 2 Features Implemented

### ✅ Post Scheduling System

- Bull Queue integration for reliable job processing
- Automatic post publishing at scheduled times
- Retry logic for failed posts
- Real-time status updates via WebSocket

### ✅ Media Upload Service

- Cloudinary integration for image/video storage
- File type validation and size limits
- Automatic optimization and transformations
- Multiple file upload support

### ✅ Social Media Publishing

- Platform-specific content validation
- Mock publishing to Twitter, LinkedIn, Facebook, Instagram
- Error handling and status tracking
- Platform post ID storage

### ✅ Enhanced Real-time Features

- Authenticated WebSocket connections
- Organization-based rooms
- Real-time post status updates
- Live notifications and typing indicators

### ✅ Background Jobs & Cron Tasks

- Hourly analytics sync scheduling
- Stalled post detection and cleanup
- Health checks and monitoring
- Graceful shutdown handling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account and project
- Firebase project with Firestore enabled

### Environment Setup

1. Copy the environment variables:

```bash
cp .env.example .env
```

2. Create a Firebase service account:

   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

3. Update the `.env` file with your Firebase credentials:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
JWT_SECRET=your_super_secret_jwt_key
```

### Database Setup

1. Run Firebase setup:

```bash
npm run firebase:setup
```

This will initialize Firebase connection and create the necessary Firestore collections.

### Development

1. Start the development server:

```bash
npm run server:dev
```

2. Or start both frontend and backend:

```bash
npm run dev:full
```

The API will be available at `http://localhost:3001`

## 📁 Project Structure

```
backend/
├── src/
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts         # Authentication middleware
│   │   ├── errorHandler.ts # Error handling
│   │   └── requestLogger.ts # Request logging
│   ├── routes/             # API routes
│   │   ├── auth.ts         # Authentication endpoints
│   │   ├── users.ts        # User management
│   │   ├── socialAccounts.ts # Social media accounts
│   │   ├── posts.ts        # Post management with scheduling
│   │   ├── analytics.ts    # Analytics endpoints
│   │   ├── media.ts        # File upload and management
│   │   ├── communities.ts  # Community management
│   │   ├── moderation.ts   # Moderation tools
│   │   └── ai.ts          # AI-powered features
│   ├── services/           # Business logic services
│   │   ├── database.ts     # Firebase Firestore client
│   │   ├── websocket.ts    # WebSocket handling
│   │   ├── queue.ts        # Bull Queue for job processing
│   │   ├── cron.ts         # Background job scheduling
│   │   ├── publishing.ts   # Social media publishing
│   │   └── media.ts        # Cloudinary integration
│   ├── types/              # TypeScript type definitions
│   │   └── database.ts     # Database types
│   ├── scripts/            # Utility scripts
│   │   └── migrate.ts      # Database migration runner
│   └── server.ts           # Main server file
├── migrations/             # Database migration files
│   └── 001_initial_schema.sql
├── dist/                   # Compiled JavaScript (generated)
└── tsconfig.json          # TypeScript configuration
```

## 🔌 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/forgot-password` - Password reset

### Users

- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users` - List users (Admin only)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user (Admin only)
- `DELETE /api/v1/users/:id` - Delete user (Admin only)

### Social Accounts

- `GET /api/v1/social-accounts` - List connected accounts
- `POST /api/v1/social-accounts` - Connect new account
- `GET /api/v1/social-accounts/:id` - Get account details
- `PUT /api/v1/social-accounts/:id` - Update account
- `DELETE /api/v1/social-accounts/:id` - Disconnect account
- `POST /api/v1/social-accounts/:id/sync` - Sync account data

### Posts

- `GET /api/v1/posts` - List posts
- `POST /api/v1/posts` - Create new post (with scheduling support)
- `GET /api/v1/posts/:id` - Get post details
- `PUT /api/v1/posts/:id` - Update post
- `DELETE /api/v1/posts/:id` - Delete post
- `POST /api/v1/posts/:id/publish` - Publish post immediately
- `POST /api/v1/posts/:id/schedule` - Schedule post for later
- `GET /api/v1/posts/drafts` - List draft posts
- `GET /api/v1/posts/scheduled` - List scheduled posts

### Media

- `POST /api/v1/media/upload` - Upload media files
- `GET /api/v1/media` - List uploaded media
- `GET /api/v1/media/:id` - Get media details
- `DELETE /api/v1/media/:id` - Delete media file
- `POST /api/v1/media/bulk-upload` - Upload multiple files

### Communities

- `GET /api/v1/communities` - List communities
- `POST /api/v1/communities` - Create community
- `GET /api/v1/communities/:id` - Get community details
- `PUT /api/v1/communities/:id` - Update community
- `DELETE /api/v1/communities/:id` - Delete community
- `GET /api/v1/communities/:id/members` - List community members
- `POST /api/v1/communities/:id/members` - Add member

### Moderation

- `GET /api/v1/moderation/queue` - Get moderation queue
- `POST /api/v1/moderation/action` - Take moderation action
- `GET /api/v1/moderation/stats` - Get moderation statistics
- `POST /api/v1/moderation/auto-moderate` - Auto-moderate content

### AI Features

- `POST /api/v1/ai/content-suggestions` - Get AI content suggestions
- `POST /api/v1/ai/hashtag-recommendations` - Get hashtag recommendations
- `POST /api/v1/ai/sentiment-analysis` - Analyze content sentiment
- `POST /api/v1/ai/auto-moderate` - AI-powered content moderation

### Analytics

- `GET /api/v1/analytics/overview` - Get analytics overview
- `GET /api/v1/analytics/posts` - Get post analytics
- `GET /api/v1/analytics/platforms` - Get platform analytics
- `GET /api/v1/analytics/engagement` - Get engagement metrics
- `GET /api/v1/analytics/top-posts` - Get top performing posts

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 🌐 WebSocket Events

The API supports real-time updates via WebSocket connections with organization-based rooms:

### Client Events

- `join-room` - Join organization room
- `leave-room` - Leave organization room
- `subscribe-post-updates` - Subscribe to post status updates
- `unsubscribe-post-updates` - Unsubscribe from post updates
- `subscribe-analytics-updates` - Subscribe to analytics updates
- `unsubscribe-analytics-updates` - Unsubscribe from analytics updates
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator
- `ping` - Health check

### Server Events

- `connected` - Connection established
- `post-created` - New post notification
- `post-status-update` - Post status changed (scheduled, published, failed)
- `user-connected` - User joined organization
- `user-disconnected` - User left organization
- `user-typing` - User is typing
- `user-stopped-typing` - User stopped typing
- `analytics-updated` - New analytics data
- `notification` - New notification
- `pong` - Health check response

## 🛡️ Security Features

- JWT-based authentication
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation with Zod
- Firestore security rules for data access control
- Request logging and monitoring

## 🗄️ Database Schema

The application uses Firebase Firestore with the following main collections:

- `organizations` - Organization/company data
- `users` - User accounts and profiles
- `social_accounts` - Connected social media accounts
- `posts` - Social media posts and content
- `analytics` - Engagement and performance metrics

Each document in Firestore has an auto-generated ID and contains the relevant fields for that entity type.

## 🔧 Configuration

Key environment variables:

### Core Configuration

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_EXPIRES_IN` - Token expiration time

### Firebase Configuration

- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_PRIVATE_KEY_ID` - Firebase private key ID
- `FIREBASE_PRIVATE_KEY` - Firebase private key
- `FIREBASE_CLIENT_EMAIL` - Firebase client email
- `FIREBASE_CLIENT_ID` - Firebase client ID

### External Services

- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `REDIS_URL` - Redis connection URL for Bull Queue

### Security & Rate Limiting

- `CORS_ORIGIN` - Allowed CORS origins
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

## 📝 Development Notes

- The API is designed to work with the React frontend
- All routes require authentication except auth endpoints
- Organization-scoped data access is enforced
- WebSocket connections require authentication with JWT tokens
- All routes have been migrated to use Firebase Firestore
- Mock data is used for analytics until platform APIs are integrated
- Firestore security rules ensure proper data isolation
- Bull Queue handles background job processing for scheduled posts
- Cloudinary integration provides optimized media storage
- Real-time features use Socket.io with organization-based rooms
- Automated post scheduling with retry logic for failed posts
- Health checks and monitoring for production deployment
- Rate limiting prevents API abuse (100 requests per 15 minutes)
- Input validation using Zod for type safety

## 🚀 Deployment

1. Build the backend:

```bash
npm run build:backend
```

2. Set up Firebase in production:

```bash
npm run firebase:setup
```

3. Start the production server:

```bash
npm run server
```

**Note**: Make sure to set up your production Firebase project and update environment variables accordingly.

## 📊 Health Check

Check if the API is running:

```bash
curl http://localhost:3001/health
```

Response:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```
