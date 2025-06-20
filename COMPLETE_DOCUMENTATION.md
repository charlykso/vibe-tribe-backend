# Tribe - Complete Application Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Technology Stack](#technology-stack)
5. [Environment Setup](#environment-setup)
6. [Authentication System](#authentication-system)
7. [Email System](#email-system)
8. [Database Structure](#database-structure)
9. [API Endpoints](#api-endpoints)
10. [Frontend Components](#frontend-components)
11. [Deployment](#deployment)
12. [Testing](#testing)
13. [Security](#security)
14. [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

Tribe is a comprehensive social media management platform that allows users to:

- Manage multiple social media accounts (Twitter, LinkedIn, Facebook, Instagram)
- Create and schedule posts across platforms
- Collaborate with team members in organizations
- Track analytics and engagement
- Use AI-powered content suggestions
- Manage media uploads with Cloudinary integration

### Live URLs

- **Frontend**: https://vibe-tribe-manager.netlify.app
- **Backend**: https://vibe-tribe-backend-8yvp.onrender.com
- **Health Check**: https://vibe-tribe-backend-8yvp.onrender.com/health

## 🏗️ Architecture

### Frontend Architecture

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   ├── forms/          # Form components
│   └── features/       # Feature-specific components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── services/           # API service functions
├── types/              # TypeScript type definitions
└── styles/             # CSS and styling files
```

### Backend Architecture

```
backend/src/
├── routes/             # API route handlers
├── services/           # Business logic services
├── middleware/         # Express middleware
├── types/              # TypeScript type definitions
├── scripts/            # Utility scripts
└── __tests__/          # Test files
```

## ✨ Features

### Core Features

- ✅ **User Authentication** - JWT-based with persistent sessions
- ✅ **Email Verification** - SendGrid integration for user verification
- ✅ **Social Media OAuth** - Connect Twitter, LinkedIn, Facebook, Instagram
- ✅ **Post Management** - Create, edit, schedule, and publish posts
- ✅ **Media Upload** - Cloudinary integration for image/video uploads
- ✅ **Organization Management** - Team collaboration features
- ✅ **Real-time Updates** - WebSocket integration
- ✅ **Analytics Dashboard** - Track engagement and performance
- ✅ **AI Content Suggestions** - OpenAI integration for content ideas

### Advanced Features

- ✅ **Draft Management** - Auto-save drafts every 30 seconds
- ✅ **Post Scheduling** - Calendar-based scheduling interface
- ✅ **Content Moderation** - AI-powered content filtering
- ✅ **Rate Limiting** - API protection and abuse prevention
- ✅ **CSRF Protection** - Security against cross-site attacks
- ✅ **Input Sanitization** - XSS protection

## 🛠️ Technology Stack

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: React Context + Custom Hooks
- **Form Handling**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Calendar**: @fullcalendar/react
- **Icons**: Lucide React

### Backend

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: JWT + Firebase Auth
- **Email Service**: SendGrid
- **File Storage**: Cloudinary
- **WebSocket**: Socket.io
- **Validation**: Zod
- **Testing**: Jest + Supertest

### Infrastructure

- **Frontend Hosting**: Netlify
- **Backend Hosting**: Render
- **Database**: Firebase Firestore
- **CDN**: Cloudinary
- **Email**: SendGrid
- **Caching**: Redis (production)

## 🔧 Environment Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Local Development Setup

1. **Clone Repository**

```bash
git clone <repository-url>
cd vibe-tribe-manager
```

2. **Install Dependencies**

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

3. **Environment Variables**

Create `.env` files with the following variables:

**Frontend (.env)**

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001
```

**Backend (backend/.env)**

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# SendGrid Email
SENDGRID_API_KEY=SG.your_sendgrid_api_key
FROM_EMAIL=your_email@domain.com
FROM_NAME=Tribe

# Social Media OAuth
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
FRONTEND_URL=http://localhost:8080
```

4. **Start Development Servers**

```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
npm run dev
```

## 🔐 Authentication System

### JWT Token Management

- **Token Storage**: localStorage (persistent sessions)
- **Token Validation**: Automatic validation on app initialization
- **Token Refresh**: 7-day expiration with automatic cleanup
- **Session Persistence**: Maintains login state across browser refreshes

### Authentication Flow

1. **Registration**: User creates account → Email verification sent
2. **Email Verification**: User clicks link → Account activated
3. **Login**: Credentials validated → JWT token issued
4. **Protected Routes**: Token validated on each request
5. **Logout**: Token removed from storage

### Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Signing**: HS256 algorithm with secure secret
- **CSRF Protection**: Double-submit cookie pattern
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Sanitization**: XSS protection on all inputs

## 📧 Email System

### SendGrid Integration

- **Service**: SendGrid API for reliable email delivery
- **Templates**: Professional HTML email templates
- **Types**: Verification, password reset, invitations

### Email Templates

1. **Verification Email**

   - Subject: "Verify your Tribe account"
   - Contains secure verification link
   - Expires in 24 hours

2. **Password Reset**

   - Subject: "Reset your Tribe password"
   - Contains secure reset link
   - Expires in 1 hour

3. **Organization Invitation**
   - Subject: "You're invited to join [Organization] on Tribe"
   - Contains invitation acceptance link
   - Expires in 7 days

### Email Configuration

```typescript
// Auto-detection of email provider
const hasValidSendGrid = process.env.SENDGRID_API_KEY?.startsWith('SG.')
const provider = hasValidSendGrid ? 'sendgrid' : 'nodemailer'
```

## 🗄️ Database Structure

### Firebase Firestore Collections

#### Users Collection

```typescript
interface User {
  id: string
  email: string
  name: string
  hashedPassword: string
  isEmailVerified: boolean
  emailVerificationToken?: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  organizationId?: string
  role: 'owner' | 'admin' | 'member'
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}
```

#### Organizations Collection

```typescript
interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  ownerId: string
  memberIds: string[]
  settings: {
    allowMemberInvites: boolean
    requireApproval: boolean
  }
  createdAt: Date
  updatedAt: Date
}
```

#### Posts Collection

```typescript
interface Post {
  id: string
  userId: string
  organizationId: string
  content: string
  mediaUrls: string[]
  platforms: ('twitter' | 'linkedin' | 'facebook' | 'instagram')[]
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduledAt?: Date
  publishedAt?: Date
  analytics: {
    views: number
    likes: number
    shares: number
    comments: number
  }
  createdAt: Date
  updatedAt: Date
}
```

#### Social Accounts Collection

```typescript
interface SocialAccount {
  id: string
  userId: string
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram'
  platformUserId: string
  username: string
  displayName: string
  profileImageUrl?: string
  accessToken: string
  refreshToken?: string
  tokenExpiresAt?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

## 🔌 API Endpoints

### Authentication Endpoints

```
POST   /api/v1/auth/register          # User registration
POST   /api/v1/auth/login             # User login
POST   /api/v1/auth/logout            # User logout
GET    /api/v1/auth/me                # Get current user
POST   /api/v1/auth/verify-email      # Verify email address
POST   /api/v1/auth/forgot-password   # Request password reset
POST   /api/v1/auth/reset-password    # Reset password
```

### User Management

```
GET    /api/v1/users                  # Get all users (admin)
GET    /api/v1/users/:id              # Get user by ID
PUT    /api/v1/users/:id              # Update user
DELETE /api/v1/users/:id              # Delete user
```

### Organization Management

```
GET    /api/v1/organizations          # Get user's organizations
POST   /api/v1/organizations          # Create organization
GET    /api/v1/organizations/:id      # Get organization details
PUT    /api/v1/organizations/:id      # Update organization
DELETE /api/v1/organizations/:id      # Delete organization
```

### Post Management

```
GET    /api/v1/posts                  # Get posts
POST   /api/v1/posts                  # Create post
GET    /api/v1/posts/:id              # Get post by ID
PUT    /api/v1/posts/:id              # Update post
DELETE /api/v1/posts/:id              # Delete post
POST   /api/v1/posts/:id/publish      # Publish post
POST   /api/v1/posts/:id/schedule     # Schedule post
```

### Social Media Integration

```
GET    /api/v1/social-accounts        # Get connected accounts
POST   /api/v1/social-accounts        # Connect new account
DELETE /api/v1/social-accounts/:id    # Disconnect account
GET    /api/v1/oauth/:platform        # OAuth initiation
GET    /api/v1/oauth/:platform/callback # OAuth callback
```

### Media Management

```
POST   /api/v1/media/upload           # Upload media file
GET    /api/v1/media/:id              # Get media details
DELETE /api/v1/media/:id              # Delete media file
```

### Analytics

```
GET    /api/v1/analytics/overview     # Get analytics overview
GET    /api/v1/analytics/posts        # Get post analytics
GET    /api/v1/analytics/engagement   # Get engagement metrics
```

## 🎨 Frontend Components

### Core Components

#### Layout Components

- **Header**: Navigation, user dropdown, notifications
- **Sidebar**: Main navigation menu with collapsible sections
- **Footer**: Copyright and links
- **ProtectedRoute**: Authentication wrapper for protected pages

#### Form Components

- **LoginForm**: User authentication form
- **RegisterForm**: User registration with validation
- **PostComposer**: Rich text editor for creating posts
- **MediaUpload**: Drag-and-drop file upload with preview
- **ScheduleModal**: Calendar-based post scheduling

#### Feature Components

- **DashboardStats**: Analytics overview cards
- **PostList**: Paginated list of posts with filters
- **SocialAccountCard**: Connected account management
- **CalendarView**: Post scheduling calendar
- **AnalyticsChart**: Interactive charts for metrics

### UI Components (shadcn/ui)

- **Button**: Various button styles and sizes
- **Input**: Form input fields with validation
- **Card**: Content containers with headers and footers
- **Dialog**: Modal dialogs for confirmations
- **Alert**: Success, error, and warning messages
- **Badge**: Status indicators and labels
- **Tabs**: Tabbed content organization
- **Calendar**: Date picker and calendar views

### Custom Hooks

```typescript
// Authentication hook
const { user, login, logout, register, isAuthenticated } = useAuth()

// API data fetching
const { data, loading, error, refetch } = useApi('/api/v1/posts')

// Form handling
const { register, handleSubmit, errors } = useForm()

// WebSocket connection
const { connected, emit, on } = useWebSocket()
```

## 🚀 Deployment

### Frontend Deployment (Netlify)

#### Automatic Deployment

```bash
# Build and deploy to production
npm run build
npx netlify deploy --prod --dir=dist
```

#### Environment Variables (Netlify)

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=https://vibe-tribe-backend-8yvp.onrender.com/api/v1
VITE_WS_URL=wss://vibe-tribe-backend-8yvp.onrender.com
VITE_NODE_ENV=production
```

### Backend Deployment (Render)

#### Deployment Configuration

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Node Version**: 18.x
- **Environment**: Production

#### Environment Variables (Render)

```
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://vibe-tribe-manager.netlify.app
FRONTEND_URL=https://vibe-tribe-manager.netlify.app

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# JWT Configuration
JWT_SECRET=production_jwt_secret_change_this
JWT_EXPIRES_IN=7d

# SendGrid Email
SENDGRID_API_KEY=SG.your_sendgrid_api_key
FROM_EMAIL=your_email@domain.com
FROM_NAME=Tribe

# Social Media OAuth (Update redirect URIs)
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/twitter/callback

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/linkedin/callback

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=https://vibe-tribe-backend-8yvp.onrender.com/api/v1/oauth/facebook/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis (Production)
REDIS_URL=redis://your_redis_url:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
```

## 🧪 Testing

### Frontend Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Backend Testing

```bash
# Run all tests
cd backend
npm test

# Run specific test file
npm test auth.test.js

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
backend/__tests__/
├── auth.test.js           # Authentication tests
├── analytics.test.js      # Analytics tests
├── analyticsSync.test.js  # Analytics sync tests
└── setup.js              # Test configuration
```

### Test Examples

```javascript
// Authentication test
describe('POST /api/v1/auth/register', () => {
  it('should register a new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    }

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201)

    expect(response.body.user.email).toBe(userData.email)
  })
})
```

## 🔒 Security

### Authentication Security

- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 rounds
- **Session Management**: Secure token storage and validation
- **Email Verification**: Required for account activation

### API Security

- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Zod schema validation on all endpoints
- **Input Sanitization**: XSS protection using DOMPurify
- **CSRF Protection**: Double-submit cookie pattern

### Data Security

- **Environment Variables**: Sensitive data in environment variables
- **Firebase Security Rules**: Database access control
- **HTTPS Only**: All production traffic over HTTPS
- **Secure Headers**: Security headers middleware

### Security Headers

```javascript
// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )
  next()
})
```

## 🔧 Troubleshooting

### Common Issues

#### CORS Errors

**Problem**: Frontend can't connect to backend
**Solution**:

1. Check `CORS_ORIGIN` environment variable on Render
2. Ensure it matches your Netlify URL exactly
3. Redeploy backend after changes

#### Authentication Issues

**Problem**: Users can't login or stay logged in
**Solution**:

1. Check JWT_SECRET is set correctly
2. Verify token expiration settings
3. Clear localStorage and try again

#### Email Not Sending

**Problem**: Verification emails not being sent
**Solution**:

1. Verify SendGrid API key is correct
2. Check FROM_EMAIL is verified in SendGrid
3. Check Render logs for email service errors

#### Database Connection Issues

**Problem**: Firebase connection errors
**Solution**:

1. Verify Firebase credentials are correct
2. Check Firebase project ID matches
3. Ensure service account has proper permissions

### Debug Commands

#### Check Backend Health

```bash
curl https://vibe-tribe-backend-8yvp.onrender.com/health
```

#### Check Environment Variables

```bash
# In Render dashboard, go to Environment tab
# Verify all required variables are set
```

#### View Logs

```bash
# Render: Go to Logs tab in dashboard
# Netlify: Go to Deploys > View logs
```

### Performance Optimization

#### Frontend Optimization

- **Code Splitting**: Dynamic imports for large components
- **Image Optimization**: Cloudinary automatic optimization
- **Bundle Analysis**: Use `npm run build:analyze`
- **Caching**: Service worker for offline functionality

#### Backend Optimization

- **Database Indexing**: Firestore composite indexes
- **Caching**: Redis for session storage and API responses
- **Connection Pooling**: Efficient database connections
- **Compression**: Gzip compression for API responses

## 📊 Monitoring and Analytics

### Application Monitoring

- **Health Checks**: `/health` endpoint for uptime monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time tracking
- **User Analytics**: Usage patterns and engagement

### Logging

```javascript
// Structured logging
logger.info('User registered', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
})
```

## 🔄 Development Workflow

### Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create pull request
# After review and approval, merge to main
```

### Code Quality

- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **TypeScript**: Type safety
- **Husky**: Pre-commit hooks

### Continuous Integration

- **Netlify**: Automatic frontend deployment on push
- **Render**: Automatic backend deployment on push
- **Testing**: Automated test runs on pull requests

## 📚 Additional Resources

### Documentation Files

- `README.md` - Project overview and setup
- `RENDER_DEPLOYMENT_GUIDE.md` - Backend deployment guide
- `frontend_todo.md` - Frontend development tasks
- `backend_todo.md` - Backend development tasks

### External Documentation

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

### Support and Community

- **GitHub Issues**: Report bugs and feature requests
- **Discord Community**: Join our developer community
- **Email Support**: support@tribe.com

---

## 📝 Changelog

### Version 1.0.0 (Current)

- ✅ User authentication with JWT
- ✅ Email verification with SendGrid
- ✅ Social media OAuth integration
- ✅ Post creation and management
- ✅ Media upload with Cloudinary
- ✅ Real-time updates with WebSocket
- ✅ Analytics dashboard
- ✅ Organization management
- ✅ Responsive UI with dark/light themes

### Upcoming Features

- 🔄 AI-powered content suggestions
- 🔄 Advanced analytics and reporting
- 🔄 Team collaboration features
- 🔄 Mobile application
- 🔄 API rate limiting improvements
- 🔄 Advanced post scheduling

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: Tribe Development Team
